// Generates realistic SVG data URLs for demonstration and instant testing

function svgToDataUrl(svgString: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString.trim())}`;
}

export function generateSampleIdFront(partner: {
  fullName: string;
  idNumber: string;
  dob: string;
  nationality: string;
  issueDate: string;
  expiryDate: string;
  gender: string;
}): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 540" width="850" height="540" style="font-family: Arial, Helvetica, sans-serif;">
    <defs>
      <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f0f4f8" />
        <stop offset="40%" stop-color="#e2e8f0" />
        <stop offset="100%" stop-color="#cbd5e1" />
      </linearGradient>
      <pattern id="guilloche" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 0 20 Q 20 0 40 20 T 80 20" fill="none" stroke="#94a3b8" stroke-width="0.5" opacity="0.3"/>
      </pattern>
    </defs>
    
    <!-- Background Card -->
    <rect width="850" height="540" rx="28" fill="url(#cardBg)" stroke="#475569" stroke-width="3"/>
    <rect width="850" height="540" rx="28" fill="url(#guilloche)"/>

    <!-- Header bar -->
    <rect x="0" y="0" width="850" height="90" rx="28" fill="#1e3a8a"/>
    <rect x="0" y="50" width="850" height="40" fill="#1e3a8a"/>
    <circle cx="65" cy="45" r="28" fill="#3b82f6" stroke="#93c5fd" stroke-width="2"/>
    <text x="65" y="52" fill="#ffffff" font-size="22" font-weight="bold" text-anchor="middle">ID</text>
    <text x="110" y="42" fill="#ffffff" font-size="24" font-weight="bold" letter-spacing="1.5">NATIONAL IDENTITY CARD</text>
    <text x="110" y="68" fill="#93c5fd" font-size="13" font-weight="600" letter-spacing="3">OFFICIAL REPUBLIQUE IDENTITY DOCUMENT</text>

    <!-- Photo container -->
    <rect x="50" y="125" width="220" height="280" rx="14" fill="#e2e8f0" stroke="#64748b" stroke-width="2"/>
    <circle cx="160" cy="220" r="60" fill="#94a3b8"/>
    <path d="M 90 380 Q 160 300 230 380 Z" fill="#64748b"/>
    <rect x="50" y="415" width="220" height="35" rx="6" fill="#1e293b"/>
    <text x="160" y="438" fill="#ffffff" font-size="14" font-weight="bold" text-anchor="middle">CHIP VERIFIED</text>

    <!-- Details Columns -->
    <g transform="translate(300, 130)">
      <!-- Full Name -->
      <text x="0" y="15" fill="#64748b" font-size="12" font-weight="bold" letter-spacing="1">FULL NAME / NOM COMPLET</text>
      <text x="0" y="42" fill="#0f172a" font-size="22" font-weight="bold">${partner.fullName.toUpperCase()}</text>

      <!-- ID Number -->
      <text x="0" y="85" fill="#64748b" font-size="12" font-weight="bold" letter-spacing="1">DOCUMENT ID NUMBER</text>
      <text x="0" y="112" fill="#1e3a8a" font-size="22" font-weight="bold" font-family="monospace">${partner.idNumber}</text>

      <!-- Date of Birth & Gender -->
      <text x="0" y="155" fill="#64748b" font-size="12" font-weight="bold" letter-spacing="1">DATE OF BIRTH</text>
      <text x="0" y="180" fill="#0f172a" font-size="18" font-weight="600">${partner.dob}</text>

      <text x="240" y="155" fill="#64748b" font-size="12" font-weight="bold" letter-spacing="1">GENDER</text>
      <text x="240" y="180" fill="#0f172a" font-size="18" font-weight="600">${partner.gender}</text>

      <!-- Nationality -->
      <text x="0" y="225" fill="#64748b" font-size="12" font-weight="bold" letter-spacing="1">NATIONALITY</text>
      <text x="0" y="250" fill="#0f172a" font-size="18" font-weight="600">${partner.nationality}</text>

      <!-- Issue & Expiry -->
      <text x="0" y="295" fill="#64748b" font-size="12" font-weight="bold" letter-spacing="1">ISSUE DATE</text>
      <text x="0" y="320" fill="#0f172a" font-size="18" font-weight="600">${partner.issueDate}</text>

      <text x="240" y="295" fill="#64748b" font-size="12" font-weight="bold" letter-spacing="1">EXPIRY DATE</text>
      <text x="240" y="320" fill="#b91c1c" font-size="18" font-weight="bold">${partner.expiryDate}</text>
    </g>

    <!-- Bottom security line -->
    <rect x="40" y="480" width="770" height="30" rx="6" fill="#f8fafc" stroke="#cbd5e1"/>
    <text x="55" y="500" fill="#334155" font-size="13" font-family="monospace" letter-spacing="2">IDGBR${partner.idNumber.replace(/[^A-Z0-9]/gi, '')}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;9405141F3101092GBR&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
  </svg>`;
  return svgToDataUrl(svg);
}

export function generateSampleIdBack(partner: {
  fullName: string;
  idNumber: string;
  address: string;
  authority: string;
  cardSerial: string;
}): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 540" width="850" height="540" style="font-family: Arial, Helvetica, sans-serif;">
    <defs>
      <linearGradient id="cardBackBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f8fafc" />
        <stop offset="100%" stop-color="#e2e8f0" />
      </linearGradient>
    </defs>
    <rect width="850" height="540" rx="28" fill="url(#cardBackBg)" stroke="#475569" stroke-width="3"/>

    <!-- Top magnetic stripe -->
    <rect x="0" y="45" width="850" height="65" fill="#1e293b"/>

    <!-- Barcode and Chip -->
    <g transform="translate(60, 135)">
      <rect width="320" height="70" fill="#ffffff" stroke="#94a3b8" rx="4"/>
      <!-- simulated barcode bars -->
      ${Array.from({ length: 38 })
        .map((_, i) => `<rect x="${15 + i * 7.5}" y="12" width="${(i % 3 === 0 ? 3 : 1.5)}" height="46" fill="#0f172a"/>`)
        .join('')}
      <text x="160" y="64" fill="#0f172a" font-size="10" font-family="monospace" text-anchor="middle">CARD SN: ${partner.cardSerial}</text>
    </g>

    <g transform="translate(420, 135)">
      <text x="0" y="20" fill="#64748b" font-size="12" font-weight="bold">ISSUING AUTHORITY</text>
      <text x="0" y="42" fill="#0f172a" font-size="17" font-weight="bold">${partner.authority}</text>
    </g>

    <!-- Address & Residence -->
    <g transform="translate(60, 230)">
      <rect width="730" height="110" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
      <text x="25" y="32" fill="#64748b" font-size="12" font-weight="bold" letter-spacing="1">OFFICIAL REGISTERED RESIDENTIAL ADDRESS</text>
      <text x="25" y="65" fill="#0f172a" font-size="19" font-weight="600">${partner.address}</text>
      <text x="25" y="92" fill="#475569" font-size="14">Postcode / City: United Kingdom Official Records</text>
    </g>

    <!-- Machine Readable Zone (MRZ) -->
    <g transform="translate(60, 370)">
      <rect width="730" height="120" rx="8" fill="#0f172a"/>
      <text x="25" y="42" fill="#38bdf8" font-size="20" font-family="monospace" letter-spacing="4">I&lt;GBR${partner.idNumber.replace(/[^A-Z0-9]/gi, '')}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
      <text x="25" y="78" fill="#38bdf8" font-size="20" font-family="monospace" letter-spacing="4">8805148F3101092GBR&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;8</text>
      <text x="25" y="105" fill="#94a3b8" font-size="16" font-family="monospace" letter-spacing="3">${partner.fullName.toUpperCase().replace(/\s+/g, '&lt;')}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
    </g>
  </svg>`;
  return svgToDataUrl(svg);
}

export function generateSampleTinCertificate(partner: {
  tinNumber: string;
  taxpayerName: string;
  taxOffice: string;
  registrationDate: string;
  taxType: string;
  certificateNo: string;
}): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 620" width="850" height="620" style="font-family: 'Times New Roman', Times, serif;">
    <defs>
      <linearGradient id="certBg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#f8fafc"/>
      </linearGradient>
    </defs>
    <!-- Certificate Border -->
    <rect width="850" height="620" fill="url(#certBg)" stroke="#1e3a8a" stroke-width="8"/>
    <rect x="16" y="16" width="818" height="588" fill="none" stroke="#93c5fd" stroke-width="2"/>
    <rect x="22" y="22" width="806" height="576" fill="none" stroke="#1e40af" stroke-width="1" stroke-dasharray="6,4"/>

    <!-- Header Seal & Authority -->
    <g transform="translate(425, 80)" text-anchor="middle">
      <circle cx="0" cy="-10" r="34" fill="#eff6ff" stroke="#1e3a8a" stroke-width="2.5"/>
      <polygon points="0,-32 10,-12 32,-10 16,6 20,28 0,16 -20,28 -16,6 -32,-10 -10,-12" fill="#3b82f6" opacity="0.3"/>
      <text x="0" y="-3" fill="#1e3a8a" font-size="18" font-weight="bold" font-family="Arial, sans-serif">INLAND</text>
      <text x="0" y="14" fill="#1e3a8a" font-size="11" font-weight="bold" font-family="Arial, sans-serif">REVENUE</text>
      
      <text x="0" y="48" fill="#1e3a8a" font-size="22" font-weight="bold" letter-spacing="2">GOVERNMENT REVENUE AUTHORITY</text>
      <text x="0" y="70" fill="#334155" font-size="14" font-style="italic">Department of Corporate and Personal Tax Administration</text>
      
      <line x1="-220" y1="85" x2="220" y2="85" stroke="#1e3a8a" stroke-width="2"/>
      
      <text x="0" y="115" fill="#0f172a" font-size="24" font-weight="bold" letter-spacing="1">TAX IDENTIFICATION NUMBER (TIN) CERTIFICATE</text>
      <text x="0" y="136" fill="#64748b" font-size="13" font-family="Arial, sans-serif">CERTIFICATE OF OFFICIAL TAXPAYER REGISTRATION</text>
    </g>

    <!-- Certificate details block -->
    <g transform="translate(70, 250)" font-family="Arial, Helvetica, sans-serif">
      <rect width="710" height="235" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>

      <!-- TIN Banner -->
      <rect x="20" y="20" width="670" height="54" rx="8" fill="#f0f9ff" stroke="#38bdf8"/>
      <text x="40" y="42" fill="#0369a1" font-size="12" font-weight="bold" letter-spacing="1">TAX IDENTIFICATION NUMBER (TIN)</text>
      <text x="40" y="65" fill="#0c4a6e" font-size="22" font-weight="bold" font-family="monospace">${partner.tinNumber}</text>

      <!-- Taxpayer Name -->
      <text x="40" y="105" fill="#64748b" font-size="12" font-weight="bold" letter-spacing="1">REGISTERED TAXPAYER NAME</text>
      <text x="40" y="130" fill="#0f172a" font-size="19" font-weight="bold">${partner.taxpayerName}</text>

      <!-- Tax Office -->
      <text x="400" y="105" fill="#64748b" font-size="12" font-weight="bold" letter-spacing="1">ASSIGNED TAX OFFICE / JURISDICTION</text>
      <text x="400" y="130" fill="#0f172a" font-size="17" font-weight="600">${partner.taxOffice}</text>

      <!-- Registration Date -->
      <text x="40" y="175" fill="#64748b" font-size="12" font-weight="bold" letter-spacing="1">REGISTRATION EFFECTIVE DATE</text>
      <text x="40" y="200" fill="#0f172a" font-size="17" font-weight="600">${partner.registrationDate}</text>

      <!-- Tax Type / Classification -->
      <text x="400" y="175" fill="#64748b" font-size="12" font-weight="bold" letter-spacing="1">TAXPAYER CLASSIFICATION / STATUS</text>
      <text x="400" y="200" fill="#047857" font-size="17" font-weight="bold">${partner.taxType}</text>
    </g>

    <!-- Certificate Footer with Official Seal & Signature -->
    <g transform="translate(90, 520)" font-family="Arial, Helvetica, sans-serif">
      <text x="0" y="15" fill="#64748b" font-size="11">CERTIFICATE NO: ${partner.certificateNo}</text>
      <text x="0" y="32" fill="#64748b" font-size="11">VERIFIED AGAINST NATIONAL TAX RECORD DATABASE</text>

      <line x1="470" y1="20" x2="670" y2="20" stroke="#0f172a" stroke-width="1.5"/>
      <text x="570" y="38" fill="#475569" font-size="12" font-weight="600" text-anchor="middle">COMMISSIONER GENERAL FOR TAXATION</text>
      <text x="570" y="54" fill="#94a3b8" font-size="10" text-anchor="middle">Official Authority Digital Signature</text>
    </g>
  </svg>`;
  return svgToDataUrl(svg);
}

export interface SamplePartnerSet {
  name: string;
  front: string;
  back: string;
  tin: string;
  expectedData: {
    partnerIdentification: {
      fullName: string;
      idNumber: string;
      dateOfBirth: string;
      issueDate: string;
      expiryDate: string;
      nationality: string;
      otherDetails: Array<{ label: string; value: string }>;
      idExtractable: boolean;
      idExtractionNote: null;
    };
    taxInformation: {
      tinNumber: string;
      taxpayerName: string;
      taxOffice: string;
      registrationDate: string;
      otherDetails: Array<{ label: string; value: string }>;
      tinExtractable: boolean;
      tinExtractionNote: null;
    };
  };
}

export const SAMPLE_PARTNERS: SamplePartnerSet[] = [
  {
    name: 'Elena Vance',
    front: generateSampleIdFront({
      fullName: 'Elena Vance',
      idNumber: 'GBR-840921-X4',
      dob: '14 May 1988',
      nationality: 'British',
      issueDate: '10 Jan 2021',
      expiryDate: '09 Jan 2031',
      gender: 'Female',
    }),
    back: generateSampleIdBack({
      fullName: 'Elena Vance',
      idNumber: 'GBR-840921-X4',
      address: '42 Kensington Park Road, London, W11 2BU',
      authority: 'HM Identity & Passport Directorate',
      cardSerial: 'SN-99820-2021',
    }),
    tin: generateSampleTinCertificate({
      tinNumber: '942-817-5039-T',
      taxpayerName: 'Elena Vance',
      taxOffice: 'Central London Regional Tax Directorate',
      registrationDate: '01 March 2015',
      taxType: 'Active Business Partner / Sole Practitioner',
      certificateNo: 'CERT-UK-2015-88291',
    }),
    expectedData: {
      partnerIdentification: {
        fullName: 'Elena Vance',
        idNumber: 'GBR-840921-X4',
        dateOfBirth: '14 May 1988',
        issueDate: '10 Jan 2021',
        expiryDate: '09 Jan 2031',
        nationality: 'British',
        otherDetails: [
          { label: 'Gender', value: 'Female' },
          { label: 'Registered Address', value: '42 Kensington Park Road, London, W11 2BU' },
          { label: 'Issuing Authority', value: 'HM Identity & Passport Directorate' },
          { label: 'Card Serial Number', value: 'SN-99820-2021' },
        ],
        idExtractable: true,
        idExtractionNote: null,
      },
      taxInformation: {
        tinNumber: '942-817-5039-T',
        taxpayerName: 'Elena Vance',
        taxOffice: 'Central London Regional Tax Directorate',
        registrationDate: '01 March 2015',
        otherDetails: [
          { label: 'Taxpayer Status', value: 'Active Business Partner / Sole Practitioner' },
          { label: 'Certificate Number', value: 'CERT-UK-2015-88291' },
          { label: 'Issuing Body', value: 'Government Revenue Authority' },
        ],
        tinExtractable: true,
        tinExtractionNote: null,
      },
    },
  },
  {
    name: 'Marcus Aurelius Sterling',
    front: generateSampleIdFront({
      fullName: 'Marcus Aurelius Sterling',
      idNumber: 'GBR-729401-M8',
      dob: '28 Sep 1982',
      nationality: 'British',
      issueDate: '15 Mar 2020',
      expiryDate: '14 Mar 2030',
      gender: 'Male',
    }),
    back: generateSampleIdBack({
      fullName: 'Marcus Aurelius Sterling',
      idNumber: 'GBR-729401-M8',
      address: '18 Berkeley Square, Mayfair, London, W1J 6BQ',
      authority: 'HM Identity & Passport Directorate',
      cardSerial: 'SN-44102-2020',
    }),
    tin: generateSampleTinCertificate({
      tinNumber: '519-338-9201-T',
      taxpayerName: 'Marcus Aurelius Sterling',
      taxOffice: 'Westminster City & Central Finance Office',
      registrationDate: '12 November 2012',
      taxType: 'Active Senior Managing Partner',
      certificateNo: 'CERT-UK-2012-40291',
    }),
    expectedData: {
      partnerIdentification: {
        fullName: 'Marcus Aurelius Sterling',
        idNumber: 'GBR-729401-M8',
        dateOfBirth: '28 Sep 1982',
        issueDate: '15 Mar 2020',
        expiryDate: '14 Mar 2030',
        nationality: 'British',
        otherDetails: [
          { label: 'Gender', value: 'Male' },
          { label: 'Registered Address', value: '18 Berkeley Square, Mayfair, London, W1J 6BQ' },
          { label: 'Issuing Authority', value: 'HM Identity & Passport Directorate' },
          { label: 'Card Serial Number', value: 'SN-44102-2020' },
        ],
        idExtractable: true,
        idExtractionNote: null,
      },
      taxInformation: {
        tinNumber: '519-338-9201-T',
        taxpayerName: 'Marcus Aurelius Sterling',
        taxOffice: 'Westminster City & Central Finance Office',
        registrationDate: '12 November 2012',
        otherDetails: [
          { label: 'Taxpayer Status', value: 'Active Senior Managing Partner' },
          { label: 'Certificate Number', value: 'CERT-UK-2012-40291' },
          { label: 'Issuing Body', value: 'Government Revenue Authority' },
        ],
        tinExtractable: true,
        tinExtractionNote: null,
      },
    },
  },
];
