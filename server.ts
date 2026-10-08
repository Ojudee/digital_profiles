import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const DATA_STORE_FILE = path.resolve(__dirname, 'partners-data-store.json');
let inMemoryPartners: any = null;

try {
  if (fs.existsSync(DATA_STORE_FILE)) {
    const raw = fs.readFileSync(DATA_STORE_FILE, 'utf-8');
    inMemoryPartners = JSON.parse(raw);
  }
} catch (e) {
  console.warn('Could not read existing partners-data-store.json:', e);
}

// Endpoints for persistent partners list across reloads
app.get('/api/partners', (_req, res) => {
  if (inMemoryPartners && Array.isArray(inMemoryPartners) && inMemoryPartners.length > 0) {
    res.json({ success: true, partners: inMemoryPartners });
  } else {
    res.json({ success: true, partners: null });
  }
});

app.post('/api/partners', async (req, res) => {
  try {
    const { partners } = req.body;
    if (partners === null) {
      inMemoryPartners = null;
      try {
        if (fs.existsSync(DATA_STORE_FILE)) {
          fs.unlinkSync(DATA_STORE_FILE);
        }
      } catch {}
      res.json({ success: true, message: 'Cleared' });
      return;
    }

    if (Array.isArray(partners)) {
      inMemoryPartners = partners;
      try {
        await fs.promises.writeFile(DATA_STORE_FILE, JSON.stringify(partners), 'utf-8');
      } catch (fErr) {
        console.warn('Could not persist partners to disk:', fErr);
      }
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Expected partners array or null' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save partners' });
  }
});

// Helper to parse base64 data url
function parseDataUrl(dataUrl: string): { mimeType: string; data: string } {
  if (dataUrl.startsWith('data:')) {
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      return { mimeType: matches[1], data: matches[2] };
    }
  }
  // fallback assuming jpeg
  return { mimeType: 'image/jpeg', data: dataUrl };
}

// Endpoint to extract partner profile from ID Front, ID Back, and/or TIN Certificate
app.post('/api/extract-partner-profile', async (req, res) => {
  try {
    const { idFront, idBack, tinCertificate } = req.body;

    if (!idFront && !idBack && !tinCertificate) {
      res.status(400).json({
        error: 'At least one document image (ID Front, ID Back, or TIN Certificate) is required.',
      });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const parts: any[] = [
      {
        text: `You are an executive data extraction system strictly extracting information for a "Company Partner Profile" document.
CRITICAL INSTRUCTIONS:
1. Use ONLY the attached images provided:
   ${idFront ? '- Attached ID Front Image' : '- (ID Front Image was not attached)'}
   ${idBack ? '- Attached ID Back Image' : '- (ID Back Image was not attached)'}
   ${tinCertificate ? '- Attached TIN Certificate Image' : '- (TIN Certificate Image was not attached)'}
2. Do NOT hallucinate, infer, or assume ANY missing details.
3. Do NOT include placeholder fields like "[To be completed]".
4. Base the entire profile strictly on legible information extracted from the attached images.
5. If any information cannot be read or was not attached, set the value to null or empty string, and note: "Information could not be extracted from the image."
6. Fields to extract for Partner Identification (from ID Front and ID Back):
   - Full Name
   - ID Number
   - Date of Birth
   - Issue Date
   - Expiry Date
   - Nationality
   - Other visible details (e.g., Sex/Gender, Address, Place of Birth, Issuing Authority)
7. Fields to extract for Tax Information (from TIN Certificate):
   - TIN Number
   - Taxpayer Name
   - Tax Office
   - Registration Date
   - Other visible details (e.g., Tax Type, Status, Registered Address)
8. Provide all extracted values with 100% fidelity to what is legible in the images.`,
      },
    ];

    if (idFront) {
      const parsedFront = parseDataUrl(idFront);
      parts.push({
        inlineData: {
          mimeType: parsedFront.mimeType,
          data: parsedFront.data,
        },
      });
    }

    if (idBack) {
      const parsedBack = parseDataUrl(idBack);
      parts.push({
        inlineData: {
          mimeType: parsedBack.mimeType,
          data: parsedBack.data,
        },
      });
    }

    if (tinCertificate) {
      const parsedTin = parseDataUrl(tinCertificate);
      parts.push({
        inlineData: {
          mimeType: parsedTin.mimeType,
          data: parsedTin.data,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: parts as any,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            partnerIdentification: {
              type: Type.OBJECT,
              properties: {
                fullName: { type: Type.STRING, description: 'Full name on ID, or null if not readable' },
                idNumber: { type: Type.STRING, description: 'Identification number, or null if not readable' },
                dateOfBirth: { type: Type.STRING, description: 'Date of birth, or null if not readable' },
                issueDate: { type: Type.STRING, description: 'Issue date, or null if not readable' },
                expiryDate: { type: Type.STRING, description: 'Expiry date, or null if not readable' },
                nationality: { type: Type.STRING, description: 'Nationality, or null if not readable' },
                otherDetails: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING },
                      value: { type: Type.STRING },
                    },
                    required: ['label', 'value'],
                  },
                  description: 'Any other visible details on ID Front or Back',
                },
                idExtractable: { type: Type.BOOLEAN, description: 'True if details were extracted, false if unreadable' },
                idExtractionNote: {
                  type: Type.STRING,
                  description: 'Write "Information could not be extracted from the image." if unreadable or failed, otherwise null',
                },
              },
              required: [
                'fullName',
                'idNumber',
                'dateOfBirth',
                'issueDate',
                'expiryDate',
                'nationality',
                'otherDetails',
                'idExtractable',
              ],
            },
            taxInformation: {
              type: Type.OBJECT,
              properties: {
                tinNumber: { type: Type.STRING, description: 'TIN number, or null if not readable' },
                taxpayerName: { type: Type.STRING, description: 'Taxpayer name, or null if not readable' },
                taxOffice: { type: Type.STRING, description: 'Tax office, or null if not readable' },
                registrationDate: { type: Type.STRING, description: 'Registration date, or null if not readable' },
                otherDetails: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING },
                      value: { type: Type.STRING },
                    },
                    required: ['label', 'value'],
                  },
                  description: 'Any other visible details on TIN Certificate',
                },
                tinExtractable: { type: Type.BOOLEAN, description: 'True if details were extracted, false if unreadable' },
                tinExtractionNote: {
                  type: Type.STRING,
                  description: 'Write "Information could not be extracted from the image." if unreadable or failed, otherwise null',
                },
              },
              required: [
                'tinNumber',
                'taxpayerName',
                'taxOffice',
                'registrationDate',
                'otherDetails',
                'tinExtractable',
              ],
            },
          },
          required: ['partnerIdentification', 'taxInformation'],
        },
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);

    res.json({
      success: true,
      data: parsed,
    });
  } catch (err: any) {
    console.error('Error extracting partner profile:', err);
    res.status(500).json({
      error: err?.message || 'Failed to extract profile from images.',
    });
  }
});

// Single Document AI Scanner & Formatting Inspector Endpoint
app.post('/api/scan-document', async (req, res) => {
  try {
    const { image, documentType } = req.body;

    if (!image) {
      res.status(400).json({ error: 'Image data is required for document scan.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const parsedImage = parseDataUrl(image);

    const docTypeHint =
      documentType === 'tinCertificate'
        ? 'TIN Certificate document'
        : documentType === 'idBack'
        ? 'ID Card Back document'
        : documentType === 'idFront'
        ? 'ID Card Front or Passport Bio-Page'
        : 'Identity or Tax registration document';

    const promptText = `You are a high-precision document scanner, OCR system, and document layout formatting expert.
Analyze this attached image (${docTypeHint}).

TASK:
1. Accurately identify the exact document type and title (e.g., ECOWAS National Biometric ID Card, US Passport Bio-Page, The Gambia Revenue Authority TIN Certificate).
2. Read and extract all visible text and fields strictly from the document with zero hallucination.
3. Inspect document orientation and formatting:
   - Check if the text is upright or sideways/upside-down (suggested rotation in degrees: 0, 90, 180, or 270).
   - Determine the standard aspect ratio preset:
     * 'id': Standard ID-1 identity card (85.6mm x 53.98mm, ratio ~1.58:1)
     * 'passport': Passport Bio-page ID-3 (ratio ~1.42:1)
     * 'cert': Landscape certificate format (e.g. GRA TIN Certificate, ratio ~1.47:1)
     * 'certPortrait': Portrait certificate / A4 letter format (ratio ~0.71:1 / 1:1.41)
     * 'free': Non-standard formatting
4. Evaluate visual quality (score 1-100, legibility, lighting, sharpness).
5. Extract key fields:
   - Full Name, ID / Passport Number, Dates (Birth, Issue, Expiry), Nationality, Sex, Authority.
   - TIN Number, Taxpayer Name, Tax Office, Registration Date, Status.
   - Any other visible labels and values into otherDetails.`;

    const contents = [
      { text: promptText },
      {
        inlineData: {
          mimeType: parsedImage.mimeType,
          data: parsedImage.data,
        },
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents as any,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            documentClass: {
              type: Type.STRING,
              description: 'Class of document, e.g. national_id_front, national_id_back, passport_bio, tin_certificate, other',
            },
            documentTitle: {
              type: Type.STRING,
              description: 'Official descriptive title of document, e.g. ECOWAS Identity Card (Front), GRA Tax Identification Number Certificate',
            },
            suggestedRotation: {
              type: Type.INTEGER,
              description: 'Suggested clockwise degrees to make upright: 0, 90, 180, or 270',
            },
            recommendedAspectPreset: {
              type: Type.STRING,
              description: "Recommended format preset: 'id', 'passport', 'cert', 'certPortrait', or 'free'",
            },
            qualityAssessment: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.INTEGER, description: 'Overall quality score from 1 to 100' },
                legibility: { type: Type.STRING, description: 'Legibility: Excellent, Good, Fair, or Poor' },
                lighting: { type: Type.STRING, description: 'Lighting: Even, Low light, Glare, or Balanced' },
                sharpness: { type: Type.STRING, description: 'Sharpness: Crisp/Sharp, Moderate, or Blurry' },
                notes: { type: Type.STRING, description: 'Brief observation on image quality' },
              },
              required: ['score', 'legibility', 'lighting', 'sharpness', 'notes'],
            },
            extractedData: {
              type: Type.OBJECT,
              properties: {
                fullName: { type: Type.STRING, description: 'Full Name on document, or null' },
                idNumber: { type: Type.STRING, description: 'Card or ID or Passport Number, or null' },
                dateOfBirth: { type: Type.STRING, description: 'Date of Birth, or null' },
                issueDate: { type: Type.STRING, description: 'Issue Date, or null' },
                expiryDate: { type: Type.STRING, description: 'Expiry Date, or null' },
                nationality: { type: Type.STRING, description: 'Nationality or Country, or null' },
                sex: { type: Type.STRING, description: 'Sex / Gender, or null' },
                tinNumber: { type: Type.STRING, description: 'Tax Identification Number, or null' },
                taxpayerName: { type: Type.STRING, description: 'Taxpayer / Entity Name, or null' },
                taxOffice: { type: Type.STRING, description: 'Tax Office, or null' },
                registrationDate: { type: Type.STRING, description: 'Registration Date, or null' },
                address: { type: Type.STRING, description: 'Address if visible, or null' },
                otherDetails: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING },
                      value: { type: Type.STRING },
                    },
                    required: ['label', 'value'],
                  },
                  description: 'Other visible fields and labels',
                },
              },
              required: ['otherDetails'],
            },
            summary: { type: Type.STRING, description: 'Brief summary of scanned findings' },
          },
          required: [
            'documentClass',
            'documentTitle',
            'suggestedRotation',
            'recommendedAspectPreset',
            'qualityAssessment',
            'extractedData',
            'summary',
          ],
        },
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);

    res.json({
      success: true,
      data: parsed,
    });
  } catch (err: any) {
    console.error('Error scanning document:', err);
    res.status(500).json({
      error: err?.message || 'Failed to scan document with AI.',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer();
