import { parseField } from "../utils";
import { TwoDDocParser } from "../TwoDDocParser";

function fieldMatchersID(parserResult: Awaited<ReturnType<TwoDDocParser["parse"]>>) {
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

function fieldMatchersTaxes(parserResult: Awaited<ReturnType<TwoDDocParser["parse"]>>) {
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
        _value: 2023,
      },
      inequality: {
        _is_some: 1,
        _value: 0,
      },
    },
  };
}

const matchers = {
  fieldMatchersID,
  fieldMatchersTaxes,
};
export default matchers;
