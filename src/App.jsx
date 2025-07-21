import { useCallback, useEffect, useState } from "react";
import "./App.css";
import Queue from "./Queue";
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
      { id: 2, name: "B", subHeaders: [] },
      { id: 3, name: "C", subHeaders: [] },
    ],
  },
  { id: 3, name: "Remarks", subHeaders: [] },
];

const TABLE_ID = 1;
const JOB_ID = "2G100047";
// const JOB_ID = "2G100046";
const ENTITY = "ReportTable";

export default function App() {
  const subHeaders = HEADERS.flatMap((H) => H.subHeaders);
  const [inputRows, setInputRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [flatHeaders, setFlatHeaders] = useState([]);
  const [maxRowSpan, setMaxRowSpan] = useState(0);

  const flatenHeaders = useCallback((headerObj, tempHeaders) => {
    let depth = Number.MIN_SAFE_INTEGER;
    const visited = new Set();
    const queue = new Queue();

    queue.add({ level: 1, object: headerObj, parents: [] });
    visited.add(headerObj);
    const rootNodes = {};

    while (!queue.isEmpty()) {
      const u = queue.poll();
      if (tempHeaders.length < u.level) {
        tempHeaders.push([]);
      }
      tempHeaders[u.level - 1].push(u.object);

      depth = Math.max(depth, u.level);

      if (u.object.subHeaders.length > 0)
        rootNodes[u.object.name] = { level: u.level, leafs: 0 };
      else {
        for (const rootNodeName in rootNodes) {
          if (rootNodes[rootNodeName].level !== u.level)
            rootNodes[rootNodeName].leafs += 1;
        }
      }

      for (let i = 0; i < u.object.subHeaders.length; i++) {
        const subHeader = u.object.subHeaders[i];
        if (!visited.has(subHeader)) {
          visited.add(subHeader);
          queue.add({ level: u.level + 1, object: subHeader });
        }
      }
    }

    console.log(rootNodes);

    return depth;
  }, []);

  // TODO: it will be changed.
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

  useEffect(() => {
    const tempHeaders = [];
    let depth = Number.MIN_SAFE_INTEGER;
    for (let i = 0; i < HEADERS.length; i++) {
      const tempDepth = flatenHeaders(HEADERS[i], tempHeaders);
      depth = Math.max(depth, tempDepth);
    }
    setFlatHeaders([...tempHeaders]);
    setMaxRowSpan(depth);
  }, [flatenHeaders]);

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
            {flatHeaders.map((level, i) => (
              <tr key={i}>
                {level.map((fh, j) => (
                  <th
                    key={j}
                    colSpan={fh.subHeaders.length}
                    rowSpan={fh.subHeaders.length === 0 ? maxRowSpan - i : 1}
                  >
                    {fh.name}
                  </th>
                ))}
              </tr>
            ))}
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
