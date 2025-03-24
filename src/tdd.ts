import { TwoDDocParser, base32ToUint8Array } from "./TwoDDocParser";

function uint8ArrayToStringArray(uint8Array: Uint8Array) {
  const stringArray = Array.from(uint8Array, (byte) => byte.toString());
  return stringArray;
}

function parseField(fieldId: string, fieldValue: string, fieldLength: number, separator?: string) {
  const encoder = new TextEncoder();
  const fieldData = encoder.encode(fieldValue);
  const paddedData = new Uint8Array(fieldLength);
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
  const sig = base32ToUint8Array(signature);

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

  const fieldLength = 20;

  const circuitData = {
    signature: parseSignature(result.signature),
    total_len: result.header.headerLength + result.messageData.length,
    matrix: {
      fields: {
        len: result.fields.length,
        storage: result.fields.map((field) => parseField(field.id, field.value, fieldLength, field.separator)),
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

  return { circuitData, parserResult: result };
}

export function fieldMatchersID(parserResult: Awaited<ReturnType<TwoDDocParser["parse"]>>) {
  const FIELD_MATCHER_LENGTH = 15;

  const firstNames = parserResult.fields.find((el) => el.id == "60").value.split("/");
  const firstName1 = parseField("60", firstNames[0], FIELD_MATCHER_LENGTH);
  const lastName = parseField("62", parserResult.fields.find((el) => el.id == "62").value, FIELD_MATCHER_LENGTH);

  return {
    id_first_name: {
      tdd_field_id: firstName1.id,
      field_type: 1,
      pattern: {
        _is_some: 1,
        _value: firstName1.data,
      },
      value: {
        _is_some: 0,
        _value: 0,
      },
      inequality: {
        _is_some: 0,
        _value: 0,
      },
    },
    id_last_name: {
      tdd_field_id: lastName.id,
      field_type: 1,
      pattern: {
        _is_some: 1,
        _value: lastName.data,
      },
      value: {
        _is_some: 0,
        _value: 0,
      },
      inequality: {
        _is_some: 0,
        _value: 0,
      },
    },
  };
}

export function fieldMatchersTaxes(parserResult: Awaited<ReturnType<TwoDDocParser["parse"]>>) {
  const FIELD_MATCHER_LENGTH = 15;

  const name = parserResult.fields.find((el) => el.id == "46").value.split(" ");
  const firstName = parseField("46", name[1], FIELD_MATCHER_LENGTH);
  const lastName = parseField("46", name[0], FIELD_MATCHER_LENGTH);

  const year = parseField("45", parserResult.fields.find((el) => el.id == "45").value, FIELD_MATCHER_LENGTH);

  return {
    taxes_first_name: {
      tdd_field_id: firstName.id,
      field_type: 1,
      pattern: {
        _is_some: 1,
        _value: firstName.data,
      },
      value: {
        _is_some: 0,
        _value: 0,
      },
      inequality: {
        _is_some: 0,
        _value: 0,
      },
    },
    taxes_last_name: {
      tdd_field_id: lastName.id,
      field_type: 1,
      pattern: {
        _is_some: 1,
        _value: lastName.data,
      },
      value: {
        _is_some: 0,
        _value: 0,
      },
      inequality: {
        _is_some: 0,
        _value: 0,
      },
    },
    taxes_base_revenue: {
      tdd_field_id: "41",
      field_type: 2,
      pattern: {
        _is_some: 0,
        _value: {
          len: FIELD_MATCHER_LENGTH,
          storage: Array.from({ length: FIELD_MATCHER_LENGTH }, () => "0"),
        },
      },
      value: {
        _is_some: 1,
        _value: 300,
      },
      inequality: {
        _is_some: 1,
        _value: 1,
      },
    },
    taxes_year: {
      tdd_field_id: year.id,
      field_type: 1,
      pattern: {
        _is_some: 1,
        _value: year.data,
      },
      value: {
        _is_some: 0,
        _value: 0,
      },
      inequality: {
        _is_some: 0,
        _value: 0,
      },
    },
  };
}
