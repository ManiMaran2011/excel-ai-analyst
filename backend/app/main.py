from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routes.upload import router as upload_router
from routes.chat import router as chat_router
from routes.clean import router as clean_router
from routes.export import router as export_router
from routes.insights import router as insights_router
from routes.formula import router as formula_router

load_dotenv()

app = FastAPI(
    title="Excel AI Analyst",
    description="AI-powered Excel analysis backend",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-app.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(clean_router, prefix="/api")
app.include_router(export_router, prefix="/api")
app.include_router(insights_router, prefix="/api")
app.include_router(formula_router, prefix="/api")

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Excel AI backend is running"}