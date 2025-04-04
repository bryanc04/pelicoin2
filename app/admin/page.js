"use client";

import React, { useState, useEffect } from "react";
import "ka-table/style.css";
import { DataType, Table, useTable } from "ka-table";
import { EditingMode, SortingMode } from "ka-table/enums";
import { kaPropsUtils } from "ka-table/utils";
import { openAllEditors } from "ka-table/actionCreators";
import Papa from "papaparse";
import { Button, Upload, message } from "antd";
import supabase from "../supabaseClient.js"; // Import your Supabase client setup
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import toast, { Toaster } from "react-hot-toast";

const columnHeaders = [
  "Student",
  "Grad Year",
  "Cash",
  "SMG",

  "Current Bonds",
  "Current Stocks",
  "Bonds +1",
  "Stocks +1",
  "Bonds +2",
  "Stocks +2",
  "Bonds +3",
  "Stocks +3",
  "Loans",
  "Net Worth",
  "Wage Income",
  "Capital Gains/Loss on Current Stocks",
  "Capital Gains/Loss in SMG",
  "Interest Earned on Current Bonds",
  "Withdrawals from Tax Deferred Accounts",
  "Deposits to Tax Deferred Accounts",
  "Taxable Income",
  "Taxes",
  "Net Income",
  "Beginning Cash",
  "Add Gross Wage Income",
  "Less Taxes",
  "Total Stock Purchases",
  "Total Stock Sales",
  "Total Bond Purchases",
  "Total Bond Sales",
  "Celebration Ticket",
  "Preffered Name",
  "New Loans",
  "Grants Received",
  "Loan Payments",
  "Spending",
  "Fees and Penalties",
  "Ending Cash Balance",
];

export default function Home() {
  const [dataArray, setDataArray] = useState([]);
  const [columns, setColumns] = useState([]);
  const table = useTable({
    data: dataArray,
    onDispatch: (action, tableProps) => {
      setDataArray(tableProps.data); // Update dataArray when changes are made
    },
  });

  useEffect(() => {
    // Fetch initial data from Supabase
    const fetchData = async () => {
      const { data, error } = await supabase.from("Pelicoin balances").select();
      if (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to fetch data");
      } else {
        setDataArray(data.map((row, index) => ({ ...row, id: index + 1 })));
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    // Set up table columns
    const tmpColumns = columnHeaders.map((header) => ({
      key: header,
      title: header,
      width: 120,
      dataType: DataType.String,
    }));
    setColumns(tmpColumns);
  }, []);

  const handleFileUpload = (file) => {
    Papa.parse(file, {
      header: true,
      complete: async (result) => {
        const { data, errors } = result;

        if (errors.length > 0) {
          toast.error("Error parsing CSV file");
          toast.error(errors);
          return;
        }

        console.log(data);

        const { error } = await supabase
          .from("Pelicoin balances")
          .upsert(data.filter((obj) => obj.Student.toLowerCase() !== "total"))
          .select();

        if (error) {
          console.error("Error updating Supabase:", error);
          toast.error("Failed to update data in Supabase");
        } else {
          toast.success("Data successfully uploaded");
          setDataArray(data.map((row, index) => ({ ...row, id: index + 1 })));
        }
      },
    });
  };

  const updateCells = async () => {
    if (kaPropsUtils.isValid(table.props)) {
      table.saveAllEditors();
      toast.success("Data saved locally");

      // Save updated data back to Supabase
      const { error } = await supabase
        .from("your-table-name")
        .upsert(dataArray);

      if (error) {
        console.error("Error saving data to Supabase:", error);
        toast.error("Failed to save data to Supabase");
      } else {
        toast.success("Data saved to Supabase");
      }
    } else {
      table.validate(); // Validate the table if not valid
    }
  };

  return (
    <>
      {" "}
      <Toaster />
      <SidebarProvider>
        <AppSidebar />
        <SidebarTrigger />
        <div>
          <div className="all">
            <div className="row g-0">
              <div
                className="home_column"
                style={{
                  width: "84.5%",
                }}
              >
                <div
                  style={{ height: "90vh", width: "80vw", overflow: "scroll" }}
                >
                  {columns.length > 0 && (
                    <Table
                      table={table}
                      columns={columns}
                      data={dataArray}
                      editingMode={EditingMode.Cell}
                      rowKeyField={"id"}
                      sortingMode={SortingMode.Single}
                      singleAction={openAllEditors()}
                    />
                  )}
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "10vh",
                    justifyContent: "center",
                    alignItems: "center",
                    display: "flex",
                  }}
                >
                  <Upload
                    accept=".csv"
                    showUploadList={false}
                    beforeUpload={(file) => {
                      handleFileUpload(file);
                      return false;
                    }}
                  >
                    <Button size="lg">Upload CSV</Button>
                  </Upload>
                  <Button
                    onClick={updateCells}
                    style={{ marginLeft: "10px" }}
                    size="lg"
                  >
                    Update
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
}
