import { TwoDDocParser, base32ToUint8Array } from "./TwoDDocParser";
import util from "util";

function uint8ArrayToStringArray(uint8Array: Uint8Array) {
  const stringArray = Array.from(uint8Array, (byte) => byte.toString());
  return stringArray;
}

function parseField(fieldId: string, fieldValue: string, fieldLength: number, separator?: string) {
  const encoder = new TextEncoder();
  const fieldData = encoder.encode(fieldValue);
  let paddedData = new Uint8Array(fieldLength);
  paddedData.set(fieldData);

  let length = fieldData.length;
  if (separator) {
    const encoder = new TextEncoder();
    const sep = encoder.encode(separator);
    paddedData.set(sep, fieldData.length);
    length += 1;
  }

  return {
    id: fieldId,
    data: {
      len: length,
      storage: uint8ArrayToStringArray(paddedData),
    },
  };
}

function parseSignature(signature: string) {
  let sig = base32ToUint8Array(signature);

  const N = BigInt("0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551");
  let s = BigInt(
    "0x" +
      Array.from(sig.slice(32, 64))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("")
  );

  if (s > N / BigInt(2)) {
    s = ((-s % N) + N) % N;

    const sHex = s.toString(16);
    const sHexPadded = sHex.length % 2 === 0 ? sHex : "0" + sHex;
    const sArray = new Uint8Array(sHexPadded.length / 2);
    for (let i = 0; i < sArray.length; i++) {
      sArray[i] = parseInt(sHexPadded.substr(i * 2, 2), 16);
    }
    sig.set(sArray, 32);
  }

  return uint8ArrayToStringArray(sig);
}

export async function tdd(rawData: string) {
  const parser = new TwoDDocParser();
  const result = await parser.parse(rawData);
  //   console.log(result);

  const fieldLength = 20;

  let circuitData: any = {
    signature: parseSignature(result.signature),
    total_len: result.header.headerLength + result.messageData.length,
    data: {
      data: {
        len: Object.keys(result.fields).length,
        storage: Object.entries(result.fields).map(([fieldId, field]) => parseField(fieldId, field.value, fieldLength, field.separator)),
      },
      header: {
        ca_id: result.header.caId,
        cert_id: result.header.certId,
        country_id: result.header.countryId,
        doc_type_id: result.header.docTypeId,
        perimeter_id: result.header.perimeterId,
        version: result.header.version,
        emit_date: {
          day: result.header.issuanceDate?.split("-")[2],
          month: result.header.issuanceDate?.split("-")[1],
          year: result.header.issuanceDate?.split("-")[0],
        },
        sign_date: {
          day: result.header.signatureDate?.split("-")[2],
          month: result.header.signatureDate?.split("-")[1],
          year: result.header.signatureDate?.split("-")[0],
        },
      },
    },
  };

  const FIELD_MATCHER_LENGTH = 15;
  let firstNames = result.fields["60"].value.split("/");
  let firstName1 = parseField("60", firstNames[0], FIELD_MATCHER_LENGTH);
  let lastName = parseField("62", result.fields["62"].value, FIELD_MATCHER_LENGTH);

  circuitData.first_name = {
    tdd_field_id: firstName1.id,
    pattern: firstName1.data,
  };

  circuitData.last_name = {
    tdd_field_id: lastName.id,
    pattern: lastName.data,
  };

  // console.log(util.inspect(circuitData, { depth: null, colors: true }));
  // console.log(JSON.stringify(circuitData));

  return circuitData;
}
