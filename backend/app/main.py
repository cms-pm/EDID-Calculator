"""
EDID Calculator - Backend API
FastAPI service to proxy Gemini AI requests and hide API key from client
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging
import os

from google import genai
from google.genai import types

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="EDID Calculator API",
    description="Backend proxy for Gemini AI integration",
    version="1.0.0"
)

# CORS configuration
# TODO: In production, restrict to specific frontend domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Will be restricted to edid.praqsys.net in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini API configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY environment variable not set!")
    # Don't raise error on startup - allow health check to work
else:
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        logger.info("Gemini AI client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Gemini client: {e}")
        client = None


# ============================================
# Request/Response Models
# ============================================

class ChatMessage(BaseModel):
    """Chat message model matching frontend types"""
    role: str
    text: str


class GeminiRequest(BaseModel):
    """Request model for Gemini API proxy"""
    history: List[ChatMessage]
    message: str


class FunctionCall(BaseModel):
    """Function call response from Gemini"""
    name: str
    args: Dict[str, Any]


class GeminiResponse(BaseModel):
    """Response model for Gemini API proxy"""
    text: str
    functionCall: Optional[FunctionCall] = None


# ============================================
# API Endpoints
# ============================================

@app.get("/health")
async def health_check():
    """
    Health check endpoint for Docker health checks and Traefik load balancer
    """
    return {
        "status": "healthy",
        "service": "edid-calculator-backend",
        "gemini_configured": GEMINI_API_KEY is not None
    }


@app.post("/api/gemini/analyze", response_model=GeminiResponse)
async def analyze_with_gemini(request: GeminiRequest):
    """
    Proxy Gemini AI requests to hide API key from client

    This endpoint:
    1. Receives chat history and new message from frontend
    2. Calls Gemini API with configured tools/functions
    3. Returns AI response and any function calls
    """
    if not GEMINI_API_KEY or not client:
        raise HTTPException(
            status_code=500,
            detail="Gemini API not configured. Please set GEMINI_API_KEY environment variable."
        )

    try:
        logger.info(f"Received Gemini request with {len(request.history)} history messages")

        # Configure function declaration for updating EDID form
        update_edid_form = types.FunctionDeclaration(
            name='updateEdidForm',
            description='Updates the EDID parameter form with the provided values. Use this when the user provides specific timing or color information to populate the form.',
            parameters={
                'type': 'object',
                'properties': {
                    'displayName': {'type': 'string', 'description': 'The name of the display monitor.'},
                    'pixelClock': {'type': 'number', 'description': 'Pixel clock in kHz.'},
                    'hAddressable': {'type': 'number', 'description': 'Horizontal addressable pixels.'},
                    'hBlanking': {'type': 'number', 'description': 'Horizontal blanking pixels.'},
                    'vAddressable': {'type': 'number', 'description': 'Vertical addressable lines.'},
                    'vBlanking': {'type': 'number', 'description': 'Vertical blanking lines.'},
                    'refreshRate': {'type': 'number', 'description': 'The vertical refresh rate in Hz.'},
                    'hFrontPorch': {'type': 'number', 'description': 'Horizontal front porch pixels.'},
                    'hSyncWidth': {'type': 'number', 'description': 'Horizontal sync width pixels.'},
                    'vFrontPorch': {'type': 'number', 'description': 'Vertical front porch lines.'},
                    'vSyncWidth': {'type': 'number', 'description': 'Vertical sync width lines.'},
                    'hImageSize': {'type': 'number', 'description': 'Horizontal image size in mm.'},
                    'vImageSize': {'type': 'number', 'description': 'Vertical image size in mm.'},
                    'hBorder': {'type': 'number', 'description': 'Horizontal border pixels.'},
                    'vBorder': {'type': 'number', 'description': 'Vertical border lines.'},
                    'colorimetry': {
                        'type': 'object',
                        'description': 'CIE 1931 color characteristics.',
                        'properties': {
                            'redX': {'type': 'number', 'description': "CIE 1931 'x' coordinate for the red primary color."},
                            'redY': {'type': 'number', 'description': "CIE 1931 'y' coordinate for the red primary color."},
                            'greenX': {'type': 'number', 'description': "CIE 1931 'x' coordinate for the green primary color."},
                            'greenY': {'type': 'number', 'description': "CIE 1931 'y' coordinate for the green primary color."},
                            'blueX': {'type': 'number', 'description': "CIE 1931 'x' coordinate for the blue primary color."},
                            'blueY': {'type': 'number', 'description': "CIE 1931 'y' coordinate for the blue primary color."},
                            'whiteX': {'type': 'number', 'description': "CIE 1931 'x' coordinate for the display's white point."},
                            'whiteY': {'type': 'number', 'description': "CIE 1931 'y' coordinate for the display's white point."},
                        }
                    }
                }
            }
        )

        # Call Gemini API
        response = client.models.generate_content(
            model='gemini-2.0-flash-exp',
            contents=request.message,
            config=types.GenerateContentConfig(
                system_instruction="You are an expert assistant for embedded systems engineers, specializing in display timings and the EDID specification. Your name is 'Eddy'. Answer questions clearly, concisely, and accurately to help users understand the complexities of display standards. When a user provides EDID, timing, or colorimetry information, use the `updateEdidForm` tool to populate the form fields. Inform the user that you have updated the form.",
                tools=[types.Tool(function_declarations=[update_edid_form])],
                temperature=0.7
            )
        )

        # Extract response text
        response_text = response.text if response.text else ""

        # Check for function calls
        function_call = None
        if response.candidates and len(response.candidates) > 0:
            candidate = response.candidates[0]
            if candidate.content and candidate.content.parts:
                for part in candidate.content.parts:
                    if hasattr(part, 'function_call') and part.function_call:
                        fc = part.function_call
                        function_call = FunctionCall(
                            name=fc.name,
                            args=dict(fc.args) if fc.args else {}
                        )
                        logger.info(f"Function call detected: {fc.name}")
                        break

        logger.info(f"Gemini response: {len(response_text)} chars, function_call: {function_call is not None}")

        return GeminiResponse(
            text=response_text,
            functionCall=function_call
        )

    except Exception as e:
        logger.error(f"Error calling Gemini API: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process request with Gemini AI: {str(e)}"
        )


@app.get("/")
async def root():
    """Root endpoint - provides API information"""
    return {
        "service": "EDID Calculator Backend",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "gemini_proxy": "/api/gemini/analyze"
        }
    }


# ============================================
# Startup/Shutdown Events
# ============================================

@app.on_event("startup")
async def startup_event():
    """Log startup information"""
    logger.info("=" * 50)
    logger.info("EDID Calculator Backend Starting")
    logger.info(f"Gemini API Key configured: {bool(GEMINI_API_KEY)}")
    logger.info("=" * 50)


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("EDID Calculator Backend Shutting Down")
