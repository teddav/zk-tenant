import { circuit_tenant } from "./matchers";
import { TwoDDocParser } from "./TwoDDocParser";
import { parseSignature, parseField } from "./utils";

export async function buildCircuitData(rawDataId: string, rawDataTaxes: string) {
  const formattedDataId = await tddIdCircuitFormatter(rawDataId);
  const formattedDataTaxes = await tddIdCircuitFormatter(rawDataTaxes);
  const idMatchers = circuit_tenant.fieldMatchersID(formattedDataId.parserResult);
  const taxesMatchers = circuit_tenant.fieldMatchersTaxes(formattedDataTaxes.parserResult);
  const combinedData = {
    tdd_id: formattedDataId.circuitData,
    tdd_taxes: formattedDataTaxes.circuitData,
    ...idMatchers,
    ...taxesMatchers,
  };
  return combinedData;
}

async function tddIdCircuitFormatter(rawData: string) {
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
