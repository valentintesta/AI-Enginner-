import os
import json
from typing import TypedDict, List
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from langchain.tools import Tool
from langchain_community.utilities import GoogleSerperAPIWrapper

from langgraph.graph import StateGraph, END

import PyPDF2
import requests
from bs4 import BeautifulSoup

load_dotenv()

MODEL_NAME = "gpt-4o"

if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("OPENAI_API_KEY environment variable is not set.")

llm = ChatOpenAI(
    model=MODEL_NAME,
    temperature=0.3,
    max_tokens=4000,
    api_key=os.getenv("OPENAI_API_KEY")
)

search = GoogleSerperAPIWrapper() if os.getenv("SERPER_API_KEY") else None

def google_search_tool(query: str = None, **kwargs) -> str:
    if query is None and kwargs:
        query = kwargs.get('query') or kwargs.get('__arg1')
    if not query:
        return "Error: No search query provided"
    if not search:
        return "Google Search not configured. Set SERPER_API_KEY in .env"
    try:
        results = search.results(query)
        output = []
        for i, result in enumerate(results.get('organic', [])[:5], 1):
            output.append(f"{i}. {result.get('title', '')}\n   {result.get('snippet', '')}\n   {result.get('link', '')}")
        return "\n\n".join(output) if output else "No results found"
    except Exception as e:
        return f"Search error: {str(e)}"

def scrape_website_tool(url: str = None, **kwargs) -> str:
    if url is None and kwargs:
        url = kwargs.get('url') or kwargs.get('__arg1')
    if not url:
        return "Error: No URL provided"
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        for tag in soup(["script", "style", "nav", "footer"]):
            tag.decompose()
        meta = soup.find("meta", attrs={"name": "description"}) or soup.find("meta", attrs={"property": "og:description"})
        meta_desc = meta.get("content", "") if meta else ""
        title = soup.find("title")
        title_text = title.get_text().strip() if title else ""
        text = soup.get_text()
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = '\n'.join(chunk for chunk in chunks if chunk)
        result = ""
        if title_text:
            result += f"Title: {title_text}\n\n"
        if meta_desc:
            result += f"Description: {meta_desc}\n\n"
        result += f"Content:\n{text[:5000]}"
        return result
    except Exception as e:
        return f"Error scraping {url}: {str(e)}"

tools = [
    Tool(name="GoogleSearch", func=google_search_tool,
         description="Search Google for current information. Input should be a search query string."),
    Tool(name="WebScraper", func=scrape_website_tool,
         description="Scrape content from a website. Input should be a valid URL.")
]

class DealState(TypedDict):
    company_name: str
    company_url: str
    raw_input: str
    pitch_text: str
    market_analysis: str
    product_analysis: str
    traction_analysis: str
    debate_transcript: str
    final_memo: str
    questions_to_reconsider: str


def research_company_node(state: DealState):
    print("\n[1/7] Researching company...")
    raw_input = state.get('raw_input', '')
    company_name = state.get('company_name', '')
    company_url = state.get('company_url', '')

    if len(raw_input.strip()) > 200:
        return {"pitch_text": raw_input, "company_name": company_name or "Unknown Company"}

    system_prompt = """You are a Company Research Specialist. Gather comprehensive information about a startup from web sources and compile it into a structured pitch deck."""

    user_prompt = f"""
COMPANY NAME: {company_name or "Not provided"}
COMPANY WEBSITE: {company_url or "Not provided"}
USER INPUT: {raw_input or "None"}

1. Scrape the company website if provided
2. Search for recent news (funding, launches, etc.)
3. Search for market and competitor info
4. Compile into PITCH DECK FORMAT:

---
Company: [Name]
Website: [URL]
Product/Service: [Description]
Target Market: [Customers, market size]
Traction: [Metrics, growth]
Funding: [Rounds, investors]
Team: [Founders]
Competitive Advantage: [Differentiator]
---
"""

    llm_with_tools = llm.bind_tools(tools)
    try:
        response = llm_with_tools.invoke([SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)])
        if hasattr(response, 'tool_calls') and response.tool_calls:
            tool_results = []
            for tool_call in response.tool_calls[:5]:
                for tool in tools:
                    if tool.name == tool_call['name']:
                        result = tool.func(**tool_call['args'])
                        tool_results.append(f"=== {tool_call['name']} ===\n{result}")
                        break
            final_response = llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt),
                HumanMessage(content="Research results:\n\n" + "\n\n".join(tool_results) + "\n\nCompile into the pitch deck format.")
            ])
            generated_pitch = final_response.content
        else:
            generated_pitch = response.content

        extracted_name = company_name
        if not extracted_name and "Company:" in generated_pitch:
            for line in generated_pitch.split('\n'):
                if line.strip().startswith('Company:'):
                    extracted_name = line.split(':', 1)[1].strip()
                    break

        return {"pitch_text": generated_pitch, "company_name": extracted_name or company_name or "Unknown Company"}
    except Exception as e:
        return {"pitch_text": raw_input or f"Company: {company_name}\nWebsite: {company_url}", "company_name": company_name or "Unknown Company"}


def market_analyst_node(state: DealState):
    print("\n[2/7] Market Analyst researching...")
    system_prompt = "You are a skeptical Market Analyst for a VC firm. Verify claims with searches, don't trust pitch deck numbers."
    user_prompt = f"""
STARTUP PITCH:
{state['pitch_text']}

TASKS:
1. Search for market size and growth rate
2. Search for top 3-5 competitors
3. Assess market timing (why now?)
4. Calculate realistic TAM/SAM/SOM

Output as JSON with fields:
- tam_estimate
- competitors (array)
- market_timing_score (1-10)
- timing_reason
- red_flags (array)
"""
    llm_with_tools = llm.bind_tools(tools)
    try:
        response = llm_with_tools.invoke([SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)])
        if hasattr(response, 'tool_calls') and response.tool_calls:
            tool_results = []
            for tool_call in response.tool_calls[:3]:
                for tool in tools:
                    if tool.name == tool_call['name']:
                        tool_results.append(f"{tool_call['name']}: {tool.func(**tool_call['args'])}")
                        break
            final_response = llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt),
                HumanMessage(content="Tool results:\n" + "\n\n".join(tool_results) + "\n\nProvide final analysis as JSON.")
            ])
            return {"market_analysis": final_response.content}
        return {"market_analysis": response.content}
    except Exception as e:
        return {"market_analysis": f"Error: {str(e)}"}


def product_analyst_node(state: DealState):
    print("\n[3/7] Product Analyst analyzing...")
    system_prompt = "You are a Product Analyst evaluating a startup's product feasibility and differentiation."
    user_prompt = f"""
STARTUP PITCH:
{state['pitch_text']}

COMPANY WEBSITE: {state.get('company_url', 'Not provided')}

TASKS:
1. Scrape website and analyze the product
2. Search for reviews or mentions
3. Assess technical feasibility
4. Is this a feature or a platform?

Output as JSON with fields:
- product_quality_score (1-10)
- is_live (true/false)
- tech_stack
- differentiation
- is_feature_or_platform
- technical_risks (array)
- product_market_fit (Low/Medium/High)
"""
    llm_with_tools = llm.bind_tools(tools)
    try:
        response = llm_with_tools.invoke([SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)])
        if hasattr(response, 'tool_calls') and response.tool_calls:
            tool_results = []
            for tool_call in response.tool_calls[:3]:
                for tool in tools:
                    if tool.name == tool_call['name']:
                        tool_results.append(f"{tool_call['name']}: {tool.func(**tool_call['args'])}")
                        break
            final_response = llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt),
                HumanMessage(content="Tool results:\n" + "\n\n".join(tool_results) + "\n\nProvide final analysis as JSON.")
            ])
            return {"product_analysis": final_response.content}
        return {"product_analysis": response.content}
    except Exception as e:
        return {"product_analysis": f"Error: {str(e)}"}


def traction_analyst_node(state: DealState):
    print("\n[4/7] Traction Analyst fact-checking...")
    system_prompt = "You are a financial analyst who is EXTREMELY skeptical of startup metrics."
    user_prompt = f"""
STARTUP PITCH:
{state['pitch_text']}

TASKS:
1. Search for public traction info (Crunchbase, news)
2. Verify if claimed metrics are realistic
3. Search for red flags (layoffs, pivots, failed raises)

Output as JSON with fields:
- metrics_seem_realistic (true/false)
- red_flags (array)
- missing_metrics (array)
- validation_found
- traction_score (1-10)
"""
    llm_with_tools = llm.bind_tools(tools)
    try:
        response = llm_with_tools.invoke([SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)])
        if hasattr(response, 'tool_calls') and response.tool_calls:
            tool_results = []
            for tool_call in response.tool_calls[:3]:
                for tool in tools:
                    if tool.name == tool_call['name']:
                        tool_results.append(f"{tool_call['name']}: {tool.func(**tool_call['args'])}")
                        break
            final_response = llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt),
                HumanMessage(content="Tool results:\n" + "\n\n".join(tool_results) + "\n\nProvide final analysis as JSON.")
            ])
            return {"traction_analysis": final_response.content}
        return {"traction_analysis": response.content}
    except Exception as e:
        return {"traction_analysis": f"Error: {str(e)}"}


def debate_node(state: DealState):
    print("\n[5/7] Debate starting...")
    prompt = f"""
Analyze these three reports for contradictions or tensions:

MARKET: {state['market_analysis']}
PRODUCT: {state['product_analysis']}
TRACTION: {state['traction_analysis']}

Simulate a 3-turn debate:

Format:
TOPIC: [one sentence topic]

Turn 1:
Market Agent: [argument]
Product Agent: [counter]

Turn 2:
Market Agent: [response]
Traction Agent: [interjects with data]

Turn 3:
Product Agent: [final point]
Market Agent: [conclusion]

CONSENSUS: [what they agree on]
"""
    response = llm.invoke(prompt)
    return {"debate_transcript": response.content}


def questions_to_reconsider_node(state: DealState):
    print("\n[6/7] Generating questions...")
    prompt = f"""
You are a seasoned VC Partner with 20+ years of experience.
Generate 8-12 hard-hitting questions before investing in this startup.

STARTUP PITCH: {state['pitch_text']}
MARKET REPORT: {state['market_analysis']}
PRODUCT REPORT: {state['product_analysis']}
TRACTION REPORT: {state['traction_analysis']}
DEBATE: {state['debate_transcript']}

Categories:
1. MARKET REALITY CHECK (2-3 questions)
2. PRODUCT & TECHNOLOGY RISKS (2-3 questions)
3. TRACTION & BUSINESS MODEL (2-3 questions)
4. TEAM & EXECUTION (2-3 questions)

Format:
## Questions to Reconsider Before Investing

### Market Reality Check
1. [Question]
   *Why this matters: [Explanation]*

Make these specific to THIS startup, not generic.
"""
    response = llm.invoke(prompt)
    return {"questions_to_reconsider": response.content}


def synthesizer_node(state: DealState):
    print("\n[7/7] GP writing final memo...")
    prompt = f"""
You are a General Partner making an investment decision.

COMPANY: {state.get('company_name', 'Unknown')}
PITCH: {state['pitch_text']}
MARKET: {state['market_analysis']}
PRODUCT: {state['product_analysis']}
TRACTION: {state['traction_analysis']}
DEBATE: {state['debate_transcript']}
QUESTIONS: {state.get('questions_to_reconsider', '')}

Write a 2-3 paragraph investment memo:
1. Synthesize key insights
2. Weigh the debate arguments
3. Final recommendation: [PASS] / [DIG DEEPER] / [INVEST]

Include:
- 3 key strengths
- 3 key risks
- Recommended next steps
"""
    response = llm.invoke(prompt)
    return {"final_memo": response.content}


workflow = StateGraph(DealState)
workflow.add_node("research_agent", research_company_node)
workflow.add_node("market_agent", market_analyst_node)
workflow.add_node("product_agent", product_analyst_node)
workflow.add_node("traction_agent", traction_analyst_node)
workflow.add_node("debate_agent", debate_node)
workflow.add_node("questions_agent", questions_to_reconsider_node)
workflow.add_node("synthesizer_agent", synthesizer_node)

workflow.set_entry_point("research_agent")
workflow.add_edge("research_agent", "market_agent")
workflow.add_edge("market_agent", "product_agent")
workflow.add_edge("product_agent", "traction_agent")
workflow.add_edge("traction_agent", "debate_agent")
workflow.add_edge("debate_agent", "questions_agent")
workflow.add_edge("questions_agent", "synthesizer_agent")
workflow.add_edge("synthesizer_agent", END)

app = workflow.compile()
