import requests
import xml.etree.ElementTree as ET
from fastapi import APIRouter, HTTPException
import urllib.parse

router = APIRouter(prefix="/research", tags=["research"])

def get_academic_papers(query: str, limit: int = 10):
    # If it looks like a specific title, try with quotes first for exact matching
    search_queries = [query]
    if len(query.split()) > 2:
        search_queries.insert(0, f'"{query}"')
    
    all_papers = []
    for q in search_queries:
        papers = _execute_search(q, limit)
        if papers:
            all_papers.extend(papers)
            # If we found an exact match (quoted), we might want to prioritize it
            if q.startswith('"'):
                break
                
    # Deduplicate and return
    seen = set()
    unique_papers = []
    for p in all_papers:
        if p["title"].lower() not in seen:
            unique_papers.append(p)
            seen.add(p["title"].lower())
            
    return unique_papers[:limit]

def _execute_search(query: str, limit: int):
    # 1. Semantic Scholar Search
    try:
        url = "https://api.semanticscholar.org/graph/v1/paper/search"
        params = {
            "query": query,
            "limit": limit,
            "fields": "title,authors,year,abstract,url,openAccessPdf,citationCount"
        }
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            papers = []
            for item in data.get("data", []):
                papers.append({
                    "title": item.get("title"),
                    "authors": [a.get("name") for a in item.get("authors", [])],
                    "year": item.get("year"),
                    "abstract": item.get("abstract"),
                    "url": item.get("url"),
                    "pdf": item.get("openAccessPdf", {}).get("url") if item.get("openAccessPdf") else None,
                    "citations": item.get("citationCount", 0),
                    "source": "Semantic Scholar"
                })
            if papers: return papers
    except Exception as e:
        print(f"Semantic Scholar Search Failed: {e}")

    # 2. arXiv Fallback
    try:
        arxiv_url = "http://export.arxiv.org/api/query"
        arxiv_params = {
            "search_query": f"all:{query}",
            "start": 0,
            "max_results": limit
        }
        response = requests.get(arxiv_url, params=arxiv_params, timeout=10)
        root = ET.fromstring(response.text)
        ns = {"atom": "http://www.w3.org/2005/Atom"}
        papers = []
        for entry in root.findall("atom:entry", ns):
            title_el = entry.find("atom:title", ns)
            if title_el is None: continue
            
            papers.append({
                "title": title_el.text.strip().replace("\n", " "),
                "authors": [a.find("atom:name", ns).text for a in entry.findall("atom:author", ns)],
                "year": int(entry.find("atom:published", ns).text[:4]) if entry.find("atom:published", ns) is not None else 2024,
                "abstract": entry.find("atom:summary", ns).text.strip().replace("\n", " ") if entry.find("atom:summary", ns) is not None else "",
                "url": entry.find("atom:id", ns).text if entry.find("atom:id", ns) is not None else "",
                "pdf": next((l.get("href") for l in entry.findall("atom:link", ns) if l.get("title") == "pdf" or l.get("type") == "application/pdf"), ""),
                "citations": 0,
                "source": "arXiv"
            })
        return papers
    except Exception as e:
        print(f"arXiv Search Failed: {e}")
        return []

@router.get("/search")
async def search_papers(q: str):
    if not q:
        raise HTTPException(400, "Query required")
    papers = get_academic_papers(q)
    return {"papers": papers}
