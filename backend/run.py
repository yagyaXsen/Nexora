import uvicorn

if __name__ == "__main__":
    print("[Nexora Backend] Starting dev server on http://localhost:8000...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
