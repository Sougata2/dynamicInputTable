import { useCallback, useEffect, useState } from "react";
import "./App.css";
const HEADERS = [
  { id: 1, name: "No.", subHeaders: [] },
  {
    id: 2,
    name: "Type",
    subHeaders: [
      {
        id: 1,
        name: "A",
        subHeaders: [
          { id: 1, name: "1", subHeaders: [] },
          { id: 2, name: "2", subHeaders: [] },
          { id: 3, name: "3", subHeaders: [] },
        ],
      },
      { id: 2, name: "B" },
      { id: 3, name: "C" },
    ],
  },
  { id: 3, name: "Remarks", subHeaders: [] },
];

const TABLE_ID = 1;
const JOB_ID = "2G100045";
// const JOB_ID = "2G100046";
const ENTITY = "ReportTable";

export default function App() {
  const subHeaders = HEADERS.flatMap((H) => H.subHeaders);
  const [inputRows, setInputRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);

  const prepareRow = useCallback((rowId) => {
    const tempRow = [];
    let cellId = 0;
    HEADERS.forEach((H) => {
      const rowValue = {
        tableId: TABLE_ID,
        jobId: JOB_ID,
        rowId,
        cellId: "",
        value: "",
      };

      if (H.subHeaders.length > 0) {
        H.subHeaders.forEach(() => {
          tempRow.push({
            ...rowValue,
            cellId: cellId++,
          });
        });
      } else {
        tempRow.push({
          ...rowValue,
          cellId: cellId++,
        });
      }
    });
    tempRow[0].value = rowId + 1;
    return tempRow;
  }, []);

  const shiftRows = useCallback((rowId, rows) => {
    let newRowId = rowId;
    for (let i = rowId + 1; i < rows?.length; i++) {
      rows[i][0].value = newRowId + 1;
      rows[i].forEach((cell) => {
        cell.rowId = newRowId;
      });
      newRowId++;
    }
    setRowCount(newRowId);
    return rows;
  }, []);

  const unshiftRows = useCallback((rowId, rows) => {
    let newRowId = rowId;
    for (let i = rowId; i < rows?.length; i++) {
      rows[i][0].value = newRowId + 1;
      rows[i].forEach((cell) => {
        cell.rowId = newRowId;
      });
      newRowId++;
    }
    setRowCount(newRowId);
    return rows;
  }, []);

  const addRow = useCallback(
    (rowId) => {
      const newRow = prepareRow(rowId);
      setInputRows((prevState) => [...prevState, newRow]);
    },
    [prepareRow]
  );

  const fetchData = useCallback(async () => {
    /**
     * fetching from api
     */
    const tableRows = JSON.parse(localStorage.getItem(ENTITY));

    /**
     * formatting the raw data to table data.
     */
    const tableRowsByJobIdAndTableId = tableRows?.filter(
      (tr) => tr.tableId === TABLE_ID && tr.jobId === JOB_ID
    );
    if (tableRowsByJobIdAndTableId?.length > 0) {
      const structure = Array.from(
        {
          length:
            tableRowsByJobIdAndTableId[tableRowsByJobIdAndTableId.length - 1]
              .rowId + 1,
        },
        () => []
      );
      tableRowsByJobIdAndTableId.forEach((tr) => structure[tr.rowId].push(tr));
      setInputRows(structure);
      setRowCount(
        tableRowsByJobIdAndTableId[tableRowsByJobIdAndTableId.length - 1]
          .rowId + 1
      );
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleTableInputChange(e, i, j) {
    setInputRows((prevState) => {
      prevState[i][j].value = e.target.value;
      return [...prevState];
    });
  }

  function handleDeleteRow(rowId) {
    setInputRows((prevState) => {
      const shiftedRows = shiftRows(rowId, prevState);
      shiftedRows.splice(rowId, 1);
      return [...shiftedRows];
    });
  }

  function handleInsertRowBelow(rowId) {
    const newRow = prepareRow(rowId + 1);
    console.log(unshiftRows(rowId + 1, inputRows));
    const changedRows = [...inputRows];
    changedRows.splice(rowId + 1, 0, newRow);
    const unshiftedRows = unshiftRows(rowId + 1, changedRows);
    setInputRows([...unshiftedRows]);
  }

  async function handleSave() {
    const payload = [];
    inputRows.forEach((ir) => payload.push(...ir));
    localStorage.setItem(ENTITY, JSON.stringify(payload));
    fetchData();
  }

  return (
    <main>
      <div>
        <table align="center">
          <thead>
            <tr>
              {HEADERS.map((H) => (
                <th
                  key={H.id}
                  colSpan={H.subHeaders.length}
                  rowSpan={`${H.subHeaders.length === 0 ? 2 : ""}`}
                >
                  {H.name}
                </th>
              ))}
              <th rowSpan={2}>Action</th>
            </tr>
            <tr>
              {subHeaders.map((s) => (
                <th key={s.id}>{s.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inputRows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} style={{ overflow: "hidden" }}>
                    <input
                      disabled={j === 0}
                      value={inputRows[i][j].value}
                      onChange={(e) => handleTableInputChange(e, i, j)}
                      style={{ width: "100%", border: "none", outline: "none" }}
                    />
                  </td>
                ))}
                <td
                  style={{
                    display: "flex",
                    justifyContent: "space-around",
                    alignItems: "center",
                    border: "none",
                  }}
                >
                  <span
                    style={{ cursor: "pointer" }}
                    onClick={() => handleDeleteRow(i)}
                  >
                    ❌
                  </span>
                  <span
                    style={{ cursor: "pointer" }}
                    onClick={() => handleInsertRowBelow(i)}
                  >
                    ↩️
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div
          style={{
            width: "100%",
            marginTop: "1rem",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={() => {
              addRow(rowCount);
              setRowCount((count) => count + 1);
            }}
          >
            Add Row
          </button>
        </div>
      </div>
      <div
        style={{
          width: "100%",
          marginTop: "1rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <button onClick={() => handleSave(TABLE_ID, JOB_ID)}>Save</button>
      </div>
    </main>
  );
}
