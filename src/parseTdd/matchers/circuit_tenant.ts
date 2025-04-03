import { parseField } from "../utils";
import { TwoDDocParser } from "../TwoDDocParser";

function fieldMatchersID(parserResult: Awaited<ReturnType<TwoDDocParser["parse"]>>) {
  const FIELD_MATCHER_LENGTH = 15;

  const firstNames = parserResult.fields.find((el) => el.id == "60").value.split("/");
  const firstName1 = parseField("60", firstNames[0], FIELD_MATCHER_LENGTH);
  const lastName = parseField("62", parserResult.fields.find((el) => el.id == "62").value, FIELD_MATCHER_LENGTH);

  return {
    id_first_name: firstName1.data,
    id_last_name: lastName.data,
  };
}

function fieldMatchersTaxes(parserResult: Awaited<ReturnType<TwoDDocParser["parse"]>>) {
  const FIELD_MATCHER_LENGTH = 15;

  const name = parserResult.fields.find((el) => el.id == "46").value.split(" ");
  const firstName = parseField("46", name[1], FIELD_MATCHER_LENGTH);
  const lastName = parseField("46", name[0], FIELD_MATCHER_LENGTH);

  return {
    taxes_first_name: firstName.data,
    taxes_last_name: lastName.data,
    taxes_base_revenue: 300,
    taxes_year: 2023,
  };
}

const matchers = {
  fieldMatchersID,
  fieldMatchersTaxes,
};
export default matchers;
