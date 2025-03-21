type Header = {
  version: number;
  headerLength: number;
  caId?: string;
  certId?: string;
  issuanceDate?: string;
  signatureDate?: string;
  docTypeId?: string;
  perimeterId?: string;
  countryId?: string;
};

/**
 * Parser for 2D-DOC documents
 * Handles parsing and verification of French 2D-DOC documents
 */
export class TwoDDocParser {
  GS: string;
  RS: string;
  FS: string;
  US: string;
  DC_MARKER: string;
  C40_CHARSET: string[];
  lastFieldId: string = "";

  constructor() {
    // Constants for special characters and encoding
    this.GS = String.fromCharCode(0x1d); // Group Separator
    this.RS = String.fromCharCode(0x1e); // Record Separator
    this.FS = String.fromCharCode(0x1f); // Field Separator
    this.US = String.fromCharCode(0x1c); // Unit Separator
    this.DC_MARKER = "DC";
    this.C40_CHARSET = [
      // Basic set (set 0)
      " 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      // Set 1 (shift 1)
      "!\"#$%&'()*+,-./:;<=>?@[\\]^_",
      // Set 2 (shift 2)
      "`abcdefghijklmnopqrstuvwxyz{|}~\x7F",
    ];
  }

  /**
   * Parse a 2D-DOC raw data string
   * @param {string} rawData - The raw data from the 2D-DOC
   * @returns {Promise<Object>} Parsed document data with verification status
   */
  async parse(rawData: string) {
    try {
      // Parse header first to determine version and encoding
      const header = this.parseHeader(rawData);

      if (this.getDocumentType(header.perimeterId!, header.docTypeId!).category === "INCONNU") {
        throw new Error("Document type not supported");
      }

      // Split the remaining data into message and signature zones
      const remainingData = rawData.substring(header.headerLength);
      const [messageData, signatureData, annexData] = this.splitZones(remainingData, header.version);

      // Parse message zone according to version and encoding
      const message = this.parseMessageZone(messageData, header);

      // Parse fields from message
      const parsedFields = this.parseFields(message, header);

      // Build the response object that matches the expected interface
      const result = {
        header,
        fields: parsedFields || {}, // Ensure we always return an object
        signature: signatureData,
        signatureValid: false, // Will be updated after verification
        annex: annexData ? this.parseMessageZone(annexData, header) : undefined,
        messageData: messageData,
      };

      // Verify the signature
      try {
        result.signatureValid = await verifySignature({
          header: rawData.substring(0, header.headerLength),
          message: messageData,
          signature: signatureData,
          caId: header.caId!,
          certId: header.certId ?? header.perimeterId!,
        });
      } catch (error) {
        console.error("Error verifying signature:", error);
      }

      return result;
    } catch (error: any) {
      console.error("Error parsing 2D-DOC:", error);
      throw new Error(`Failed to parse 2D-DOC: ${error.message}`);
    }
  }

  parseHeader(data: string): Header {
    if (!data.startsWith(this.DC_MARKER)) {
      throw new Error("Invalid 2D-DOC: Missing DC marker");
    }

    const version = parseInt(data.substring(2, 4), 10);
    let header: Header = {
      version,
      headerLength: this.getHeaderLength(version),
    };

    if (version <= 3) {
      // C40 encoded headers for versions 01-03
      header = {
        ...header,
        caId: data.substring(4, 8),
        certId: data.substring(8, 12),
        issuanceDate: this.parseHexDate(data.substring(12, 16)),
        signatureDate: this.parseHexDate(data.substring(16, 20)),
        docTypeId: data.substring(20, 22),
        perimeterId: version >= 3 ? data.substring(22, 24) : "01",
        countryId: version === 4 ? data.substring(24, 26) : "FR",
      };
    } else if (version === 4) {
      // Version 04 can be binary or C40 encoded
      const isBinary = this.isBinaryEncoded(data);
      if (isBinary) {
        header = {
          ...header,
          countryId: this.decodeC40(data.substring(2, 4)),
          caId: this.decodeC40(data.substring(4, 7)),
          certId: this.decodeC40(data.substring(7, 10)),
          issuanceDate: this.parseBinaryDate(data.slice(10, 13)),
          signatureDate: this.parseBinaryDate(data.slice(13, 16)),
          // @ts-ignore
          docTypeId: data[16].toString(16).padStart(2, "0"),
          // @ts-ignore
          perimeterId: data.slice(17, 19).toString(16).padStart(2, "0"),
        };
      } else {
        // C40 encoded version 4
        header = {
          ...header,
          caId: data.substring(4, 8),
          certId: data.substring(8, 12),
          issuanceDate: this.parseHexDate(data.substring(12, 16)),
          signatureDate: this.parseHexDate(data.substring(16, 20)),
          docTypeId: data.substring(20, 22),
          perimeterId: data.substring(22, 24),
          countryId: data.substring(24, 26),
        };
      }
    } else {
      throw new Error(`Unsupported 2D-DOC version: ${version}`);
    }

    return header;
  }

  getHeaderLength(version: number) {
    switch (version) {
      case 1:
      case 2:
        return 22;
      case 3:
        return 24;
      case 4:
        return 26; // For C40 encoding, 19 for binary but we handle that separately
      default:
        throw new Error(`Unsupported version: ${version}`);
    }
  }

  splitZones(data: string, version: number): [string, string, string?] {
    let messageData, signatureData, annexData;

    // For version 4, try US first, then fall back to FS
    const separators = version === 4 ? [this.US, this.FS] : [this.FS];

    let parts: string[] = [];
    for (const separator of separators) {
      parts = data.split(separator);
      if (parts.length > 1) break;
    }

    if (parts.length === 1) {
      // If no separator found, assume everything before the last 128 chars is message
      // and the rest is signature (common format for some implementations)
      const sigLength = 128; // Typical signature length
      if (data.length > sigLength) {
        messageData = data.slice(0, -sigLength);
        signatureData = data.slice(-sigLength);
      } else {
        messageData = data;
        signatureData = "";
      }
    } else {
      [messageData, signatureData] = parts;
    }

    // Handle version 4's optional annex zone
    if (version === 4 && signatureData) {
      const annexParts = signatureData.split(this.GS);
      if (annexParts.length > 1) {
        [signatureData, annexData] = annexParts;
      }
    }

    return [messageData, signatureData, annexData];
  }

  parseMessageZone(data: string, header: Header) {
    const fields = [];
    const seenFieldIds = new Set();
    let position = 0;

    while (position < data.length - 1) {
      const fieldId = data.substring(position, position + 2);

      if (fieldId === "S6") {
        break;
      }

      if (FIELD_DEFINITIONS[fieldId]) {
        if (seenFieldIds.has(fieldId)) {
          console.warn(`Warning: Duplicate field ID ${fieldId} found at position ${position}, skipping...`);
          position++;
          continue;
        }

        position += 2; // Move past field ID

        const fieldDef = FIELD_DEFINITIONS[fieldId];
        let value;

        if (fieldDef.lengthType === "fixed") {
          // For fixed length fields, just take the exact length
          value = data.substring(position, position + fieldDef.length);
          position += fieldDef.length;
        } else {
          // For variable length fields, read until separator or maxLength
          let endPos = position;
          while (endPos < data.length && data[endPos] !== this.GS && data[endPos] !== this.RS) {
            if (fieldDef.maxLength && endPos - position >= fieldDef.maxLength) {
              break;
            }
            endPos++;
          }

          value = data.substring(position, endPos);
          position = endPos;
        }

        let separator = null;

        // Skip separator if present
        if (position < data.length && data[position] === this.GS) {
          separator = this.GS;
          position++;
        }

        // Clean up value based on field type
        const cleanValue = this.cleanFieldValue(value, fieldId);

        if (cleanValue) {
          fields.push({ fieldId, value: cleanValue, separator });
          seenFieldIds.add(fieldId);
        }
      } else {
        position++;
      }
    }

    return fields;
  }

  cleanFieldValue(value: string, fieldId: string) {
    this.lastFieldId = fieldId;
    value = value.replace(/[\x00-\x1C\x1E-\x1F]/g, "");

    switch (fieldId) {
      case "10":
        // For field 10: only uppercase letters, numbers, spaces, and forward slashes
        // First, convert to uppercase and remove any invalid characters
        value = value.toUpperCase().replace(/[^A-Z0-9 /]/g, "");
        // Ensure slashes have spaces around them for readability
        value = value.replace(/\s*\/\s*/g, " / ");
        // Remove multiple consecutive spaces
        value = value.replace(/\s+/g, " ");
        return value.trim();

      // Type 01 fields
      case "24":
      case "2B":
        return value.replace(/[^0-9]/g, "").slice(0, 5);
      case "26":
      case "2D":
        return value.slice(0, 2).toUpperCase();
      case "1C":
        return value.replace(/[^0-9]/g, "").slice(0, 8);
      case "1D":
        return value.replace(/[^0-9,-]/g, "");
      case "1F":
        return value.replace(/[^0-9]/g, "");
      case "11":
      case "12":
      case "13":
      case "15":
      case "16":
      case "17":
      case "20":
      case "22":
      case "25":
      case "27":
      case "28":
      case "29":
      case "2A":
      case "2C":
        return value.replace(/[^A-Z0-9 /]/g, "").trim();
      case "1A":
      case "1B":
        return value.replace(/[^A-Z0-9]/g, "").trim();

      // Type 04 fields
      case "43":
        return value.replace(/[^0-9]/g, "").slice(0, 5);
      case "44":
        return value.replace(/[^A-Z0-9]/g, "").slice(0, 13);
      case "45":
        return value.replace(/[^0-9]/g, "").slice(0, 4);
      case "41":
      case "4W":
      case "4X":
        return value.replace(/[^0-9,-]/g, "");
      case "47":
      case "49":
        return value.replace(/[^0-9]/g, "").slice(0, 13);
      case "46":
      case "48":
        return value.replace(/[^A-Z0-9 ]/g, "").trim();
      case "4A":
        return value.replace(/[^0-9]/g, "").slice(0, 8);

      default:
        return value.trim();
    }
  }

  parseFields(message: any, header: Header) {
    const parsedFields: Record<string, any> = {};

    if (!message || !Array.isArray(message)) {
      return {};
    }

    for (const field of message) {
      // Store the field ID before getting field info and formatting
      this.lastFieldId = field.fieldId;

      const fieldInfo = this.getFieldInfo(field.fieldId, header);
      if (fieldInfo) {
        const formattedValue = this.formatFieldValue(field.value, fieldInfo.type, header);

        parsedFields[field.fieldId] = {
          name: fieldInfo.name,
          value: formattedValue,
          separator: field.separator,
        };
      }
    }

    return parsedFields;
  }

  getFieldInfo(fieldId: string, header: Header) {
    return FIELD_DEFINITIONS[fieldId];
  }

  formatFieldValue(value: string, type: string, header: Header) {
    switch (type) {
      case "date":
        const isoDate = header.version === 4 && this.isBinaryEncoded(value) ? this.parseBinaryDate(value) : this.parseHexDate(value);
        // Convert ISO date to DD-MM-YYYY
        const [year, month, day] = isoDate.split("-");
        return `${day}-${month}-${year}`;
      case "formatted_date":
        // Convert DDMMYYYY to DD-MM-YYYY
        const dd = value.substring(0, 2);
        const mm = value.substring(2, 4);
        const yyyy = value.substring(4, 8);
        return `${dd}-${mm}-${yyyy}`;
      case "year":
        return value; // YYYY format, no transformation needed
      case "integer":
        return parseInt(value, 10).toString();
      case "amount":
        // Add € symbol for monetary values
        return `${value.trim()} €`;
      case "string":
        // Special formatting for specific fields
        // TODO: remove this
        if (value.length === 13) {
          if (this.lastFieldId === "44") {
            // Format reference: XX XX XXXXXXX XX
            const formatted = `${value.substring(0, 2)} ${value.substring(2, 4)} ${value.substring(4, 11)} ${value.substring(11)}`;
            return formatted;
          } else if (this.lastFieldId === "47" || this.lastFieldId === "49") {
            // Format fiscal number: XX XX XXX XXX XXX
            const formatted = `${value.substring(0, 2)} ${value.substring(2, 4)} ${value.substring(4, 7)} ${value.substring(
              7,
              10
            )} ${value.substring(10)}`;
            return formatted;
          }
        }
        return value;
      default:
        return value;
    }
  }

  parseHexDate(hexDate: string) {
    const days = parseInt(hexDate, 16);
    const baseDate = new Date("2000-01-01");
    const resultDate = new Date(baseDate);
    resultDate.setDate(baseDate.getDate() + days);
    return resultDate.toISOString().split("T")[0];
  }

  parseBinaryDate(bytes: any): string {
    // Convert 3 bytes to MMDDYYYY format
    const value = (bytes[0] << 16) | (bytes[1] << 8) | bytes[2];
    const month = Math.floor(value / 1000000);
    const day = Math.floor((value % 1000000) / 10000);
    const year = value % 10000;
    return `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
  }

  decodeC40(data: string) {
    // Basic C40 decoding implementation
    let result = "";
    for (let i = 0; i < data.length; i += 2) {
      const byte1 = data.charCodeAt(i);
      const byte2 = data.charCodeAt(i + 1);
      const value = (byte1 << 8) | byte2;

      // Convert to C40 values
      const c1 = Math.floor(value / 1600);
      const c2 = Math.floor((value % 1600) / 40);
      const c3 = value % 40;

      result += this.C40_CHARSET[0][c1];
      result += this.C40_CHARSET[0][c2];
      result += this.C40_CHARSET[0][c3];
    }
    return result;
  }

  isBinaryEncoded(data: string) {
    // Check if any character in the string has a code point above 0x7F
    for (let i = 0; i < data.length; i++) {
      if (data.charCodeAt(i) > 0x7f) {
        return true;
      }
    }
    return false;
  }

  getDocumentType(perimeterId: string, docTypeId: string) {
    const docTypes: Record<string, Record<string, any>> = {
      "01": {
        // ANTS Perimeter
        "01": { name: "Justificatif de Domicile", category: "Justificatif" },
        "04": { name: "Avis d'impôt sur les Revenus", category: "IMPOTS" },
        "07": { name: "Carte d'identité", category: "IDENTITE" },
        // ... other ANTS document types ...
      },
      JD: {
        "01": { name: "Facture d'électricité", category: "RESIDENCE" },
        "02": { name: "Facture de gaz", category: "RESIDENCE" },
        "03": { name: "Facture d'eau", category: "RESIDENCE" },
        "04": { name: "Facture de téléphonie", category: "RESIDENCE" },
        "05": { name: "Facture d'internet", category: "RESIDENCE" },
        "06": { name: "Quittance de loyer", category: "RESIDENCE" },
        "07": { name: "Avis d'imposition", category: "RESIDENCE" },
        "08": { name: "Attestation d'assurance logement", category: "RESIDENCE" },
      },
      ID: {
        "01": { name: "Carte Nationale d'Identité", category: "IDENTITE" },
        "02": { name: "Passeport", category: "IDENTITE" },
        "03": { name: "Titre de séjour", category: "IDENTITE" },
        "04": { name: "Permis de conduire", category: "IDENTITE" },
      },
      SN: {
        L1: { name: "Attestation vaccinale", category: "SANTE" },
        L2: { name: "Certificat de test", category: "SANTE" },
        L3: { name: "Certificat de rétablissement", category: "SANTE" },
      },
      FI: {
        "01": { name: "Avis d'impôt sur le revenu", category: "IMPOTS" },
        "02": { name: "Avis de taxe d'habitation", category: "IMPOTS" },
        "03": { name: "Avis de taxe foncière", category: "IMPOTS" },
        "04": { name: "Déclaration de revenus", category: "IMPOTS" },
      },
    };

    const perimeterTypes = docTypes[perimeterId];
    if (perimeterTypes) {
      const docType = perimeterTypes[docTypeId];
      if (docType) {
        return docType;
      }
    }

    return {
      name: `Type inconnu (Périmètre: ${perimeterId}, Type: ${docTypeId})`,
      category: "INCONNU",
    };
  }
}

// Base32 alphabet used in 2D-DOC
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Convert a base32 string to Uint8Array
 * @param {string} base32 - Base32 encoded string
 * @returns {Uint8Array} - Decoded bytes
 */
export function base32ToUint8Array(base32: string): Uint8Array {
  // Remove any padding characters
  base32 = base32.replace(/=+$/, "");

  // Convert to uppercase and remove any non-base32 characters
  base32 = base32.toUpperCase().replace(/[^A-Z2-7]/g, "");

  const length = base32.length;
  const buffer = new Uint8Array(Math.floor((length * 5) / 8));
  let bits = 0;
  let value = 0;
  let index = 0;

  for (let i = 0; i < length; i++) {
    value = (value << 5) | BASE32_ALPHABET.indexOf(base32[i]);
    bits += 5;

    if (bits >= 8) {
      buffer[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }

  return buffer;
}

/**
 * Verify a 2D-DOC signature
 * @param {Object} params - Verification parameters
 * @param {string} params.header - Header data
 * @param {string} params.message - Message data
 * @param {string} params.signature - Signature data
 * @param {string} params.caId - CA ID
 * @param {string} params.certId - Certificate ID
 * @returns {Promise<boolean>} Whether signature is valid
 */
export async function verifySignature({
  header,
  message,
  signature,
  caId,
  certId,
}: {
  header: string;
  message: string;
  signature: string;
  caId: string;
  certId: string;
}) {
  try {
    // FR05
    const publicKeyBytes = new Uint8Array([
      4, 86, 124, 231, 161, 237, 241, 19, 151, 249, 180, 23, 75, 231, 182, 210, 24, 149, 175, 22, 174, 33, 206, 199, 55, 32, 217, 16, 36,
      44, 187, 134, 46, 18, 244, 129, 207, 135, 240, 110, 88, 51, 62, 197, 158, 146, 187, 108, 126, 124, 14, 99, 123, 64, 57, 25, 180, 8,
      183, 66, 113, 16, 119, 203, 128,
    ]);
    const signatureBytes = base32ToUint8Array(signature);
    const dataToVerify = header + message;
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(dataToVerify);

    const publicKey = await crypto.subtle.importKey(
      "raw",
      publicKeyBytes,
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      true,
      ["verify"]
    );

    return await crypto.subtle.verify(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" },
      },
      publicKey,
      signatureBytes,
      dataBytes
    );
  } catch (error) {
    console.error("Error during signature verification:", error);
    throw error;
  }
}

export const FIELD_DEFINITIONS: Record<string, Record<string, any>> = {
  // Type 01 (Justificatif de Domicile) - Mandatory fields
  "10": {
    name: "Ligne 1 adresse postale bénéficiaire",
    type: "string",
    lengthType: "variable",
    maxLength: 38,
  },
  "11": {
    name: "Qualité/titre du bénéficiaire",
    type: "string",
    lengthType: "variable",
    maxLength: 38,
  },
  "12": {
    name: "Prénom du bénéficiaire",
    type: "string",
    lengthType: "variable",
    maxLength: 38,
  },
  "13": {
    name: "Nom du bénéficiaire",
    type: "string",
    lengthType: "variable",
    maxLength: 38,
  },
  "20": {
    name: "Ligne 2 adresse point de service",
    type: "string",
    lengthType: "variable",
    maxLength: 38,
  },
  "22": {
    name: "Numéro et nom de voie bénéficiaire",
    type: "string",
    lengthType: "variable",
    maxLength: 38,
  },
  "24": {
    name: "Code postal point de service",
    type: "string",
    lengthType: "fixed",
    length: 5,
  },
  "26": {
    name: "Pays point de service",
    type: "string",
    lengthType: "fixed",
    length: 2,
  },

  // Type 01 (Justificatif de Domicile) - Optional fields
  "15": {
    name: "Qualité/titre destinataire facture",
    type: "string",
    lengthType: "variable",
    maxLength: 38,
  },
  "16": {
    name: "Prénom destinataire facture",
    type: "string",
    lengthType: "variable",
    maxLength: 38,
  },
  "17": {
    name: "Nom destinataire facture",
    type: "string",
    lengthType: "variable",
    maxLength: 38,
  },
  "18": {
    name: "Numéro de facture",
    type: "string",
    lengthType: "variable",
  },
  "1A": {
    name: "Numéro de contrat",
    type: "string",
    lengthType: "variable",
    maxLength: 50,
  },
  "1B": {
    name: "Identifiant souscripteur",
    type: "string",
    lengthType: "variable",
    maxLength: 50,
  },
  "1C": {
    name: "Date d'effet du contrat",
    type: "formatted_date",
    lengthType: "fixed",
    length: 8,
  },
  "1D": {
    name: "Montant TTC",
    type: "amount",
    lengthType: "variable",
    maxLength: 16,
  },
  "1F": {
    name: "Téléphone destinataire",
    type: "phone",
    lengthType: "variable",
    maxLength: 30,
  },
  "25": {
    name: "Localité point de service",
    type: "string",
    lengthType: "variable",
    maxLength: 32,
  },
  "27": {
    name: "Ligne 2 adresse destinataire",
    type: "string",
    lengthType: "variable",
    maxLength: 38,
  },
  "28": {
    name: "Ligne 3 adresse destinataire",
    type: "string",
    lengthType: "variable",
    maxLength: 38,
  },
  "29": {
    name: "Ligne 4 adresse destinataire",
    type: "string",
    lengthType: "variable",
    maxLength: 38,
  },
  "2A": {
    name: "Ligne 5 adresse destinataire",
    type: "string",
    lengthType: "variable",
    maxLength: 38,
  },
  "2B": {
    name: "Code postal destinataire",
    type: "string",
    lengthType: "fixed",
    length: 5,
  },
  "2C": {
    name: "Localité destinataire",
    type: "string",
    lengthType: "variable",
    maxLength: 32,
  },
  "2D": {
    name: "Pays destinataire",
    type: "string",
    lengthType: "fixed",
    length: 2,
  },

  // Type 04 (Tax Notice) fields
  "43": {
    name: "Nombre de parts",
    type: "integer",
    lengthType: "variable",
    maxLength: 5,
  },
  "44": {
    name: "Référence de l'avis d'impôt",
    type: "string",
    lengthType: "fixed",
    length: 13,
  },
  "45": {
    name: "Année fiscale",
    type: "year",
    lengthType: "fixed",
    length: 4,
  },
  "46": {
    name: "Nom du Déclarant 1",
    type: "string",
    lengthType: "variable",
    maxLength: 38,
  },
  "4A": {
    name: "Date limite de paiement",
    type: "formatted_date",
    lengthType: "fixed",
    length: 8,
  },
  "47": {
    name: "Numéro fiscal du Déclarant 1",
    type: "string",
    lengthType: "fixed",
    length: 13,
  },
  "41": {
    name: "Revenu fiscal de référence",
    type: "amount",
    lengthType: "variable",
    maxLength: 12,
  },
  "48": {
    name: "Nom du Déclarant 2",
    type: "string",
    lengthType: "variable",
    maxLength: 38,
  },
  "49": {
    name: "Numéro fiscal du Déclarant 2",
    type: "string",
    lengthType: "fixed",
    length: 13,
  },
  "4W": {
    name: "Montant restant à payer",
    type: "amount",
    lengthType: "variable",
    maxLength: 10,
  },
  "4X": {
    name: "Montant prélevé à la source",
    type: "amount",
    lengthType: "variable",
    maxLength: 10,
  },
  "60": {
    name: "Prénoms",
    type: "string",
    lengthType: "variable",
    maxLength: 20,
  },
  "62": {
    name: "Nom",
    type: "string",
    lengthType: "variable",
    maxLength: 20,
  },
  "65": {
    name: "Type of ID",
    type: "string",
    lengthType: "fixed",
    length: 2,
  },
  "66": {
    name: "ID number",
    type: "string",
    lengthType: "variable",
    length: 20,
  },
  "67": {
    name: "ID country",
    type: "string",
    lengthType: "fixed",
    length: 2,
  },
  "68": {
    name: "ID gender",
    type: "string",
    lengthType: "fixed",
    length: 1,
  },
  "69": {
    name: "ID birth date",
    type: "formatted_date",
    lengthType: "fixed",
    length: 8,
  },
  "6C": {
    name: "ID birth country",
    type: "string",
    lengthType: "fixed",
    length: 2,
  },
};
