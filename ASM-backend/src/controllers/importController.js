const XLSX = require("xlsx");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");

const MAX_EXCEL_ROWS = 200;
const EXCEL_FIELDS = ["front", "back", "front_img", "back_img", "color"];

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeHeader(value) {
  return cleanText(value).toLowerCase();
}

function isEmptyRow(row) {
  return row.every((cell) => cleanText(cell) === "");
}

function normalizeColor(value) {
  const color = cleanText(value);
  return /^#[0-9a-f]{6}$/i.test(color) ? color : "#ffffff";
}

function buildHeaderMap(headerRow) {
  return headerRow.reduce((map, value, index) => {
    const key = normalizeHeader(value);
    if (EXCEL_FIELDS.includes(key) && map[key] === undefined) {
      map[key] = index;
    }
    return map;
  }, {});
}

function getCell(row, headerMap, key) {
  const index = headerMap[key];
  return index === undefined ? "" : cleanText(row[index]);
}

function workbookFromUpload(file) {
  try {
    return XLSX.read(file.buffer, { type: "buffer" });
  } catch (error) {
    throw new ApiError(400, "Excel file is invalid");
  }
}

const importExcel = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Excel file is required");

  const workbook = workbookFromUpload(req.file);
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) throw new ApiError(400, "Excel file has no sheets");

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
    header: 1,
    blankrows: false,
    defval: "",
    raw: false,
  });

  if (!rows.length) throw new ApiError(400, "Excel sheet is empty");

  const headerMap = buildHeaderMap(rows[0]);
  if (headerMap.front === undefined || headerMap.back === undefined) {
    throw new ApiError(400, "Excel must include front and back columns");
  }

  const dataRows = rows
    .slice(1)
    .map((row, index) => ({ row, rowNumber: index + 2 }))
    .filter((item) => !isEmptyRow(item.row));

  if (dataRows.length > MAX_EXCEL_ROWS) {
    throw new ApiError(400, `Excel can contain at most ${MAX_EXCEL_ROWS} rows`);
  }

  const cards = [];
  const errors = [];

  dataRows.forEach(({ row, rowNumber }) => {
    const front = getCell(row, headerMap, "front");
    const back = getCell(row, headerMap, "back");

    if (!front || !back) {
      errors.push({
        row: rowNumber,
        message: "Missing front or back",
      });
      return;
    }

    cards.push({
      front,
      front_img: getCell(row, headerMap, "front_img"),
      back,
      back_img: getCell(row, headerMap, "back_img"),
      color: normalizeColor(getCell(row, headerMap, "color")),
      position: cards.length,
    });
  });

  sendSuccess(res, {
    rows_count: dataRows.length,
    valid_count: cards.length,
    error_count: errors.length,
    cards,
    errors,
  }, "Import Excel preview successfully");
});

module.exports = {
  importExcel,
};
