"use client";

import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import supabase from "../supabaseClient.js";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast, Toaster } from "react-hot-toast";

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
  const [loading, setLoading] = useState(true);
  const [visibleColumns, setVisibleColumns] = useState([
    "Student",
    "Grad Year",
    "Cash",
    "SMG",
    "Net Worth",
  ]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Fetch initial data from Supabase
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("Pelicoin balances")
          .select();
        if (error) {
          console.error("Error fetching data:", error);
          toast.error("Failed to fetch data");
        } else {
          setDataArray(
            data.sort((a, b) =>
              a.Student.toLowerCase().localeCompare(b.Student.toLowerCase())
            )
          );
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        toast.error("An error occurred while fetching data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (result) => {
        let { data, errors } = result;

        if (errors.length > 0) {
          toast.error("Error parsing CSV file");
          console.error(errors);
          return;
        }

        // Filter out rows with "total" in Student field and sort by Student name
        data = data
          .filter((obj) => obj.Student && obj.Student.toLowerCase() !== "total")
          .sort((a, b) =>
            a.Student.toLowerCase().localeCompare(b.Student.toLowerCase())
          );

        console.log(data);

        // Update Supabase with the new data
        const { error } = await supabase.from("Pelicoin balances").upsert(data);

        if (error) {
          console.error("Error updating Supabase:", error);
          toast.error("Failed to update data in Supabase");
        } else {
          toast.success("Data successfully uploaded");
          setDataArray(data);
        }
      },
    });
  };

  // Filter data based on search term
  const filteredData = dataArray.filter(
    (row) =>
      row.Student &&
      row.Student.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Toaster />
      <SidebarProvider>
        <AppSidebar />
        <SidebarTrigger />
        <div
          className="container mx-auto py-4 px-2"
          style={{ position: "relative", top: "5vh", height: "fit-content" }}
        >
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Pelicoin Balances</h1>

            <div className="flex gap-4 items-center">
              <Input
                placeholder="Search by student name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Columns <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 max-h-96 overflow-y-auto">
                  {columnHeaders.map((column) => (
                    <DropdownMenuItem
                      key={column}
                      className="flex items-center gap-2"
                      onSelect={(e) => {
                        e.preventDefault();
                        setVisibleColumns((prev) =>
                          prev.includes(column)
                            ? prev.filter((col) => col !== column)
                            : [...prev, column]
                        );
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns.includes(column)}
                        onChange={() => {}}
                        className="mr-2"
                      />
                      {column}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div>
                <Input
                  type="file"
                  accept=".csv"
                  id="csv-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <label htmlFor="csv-upload">
                  <Button variant="default" asChild>
                    <span>Upload CSV</span>
                  </Button>
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-md">
            {/* Use grid for layout to maintain header position */}
            <div
              className="overflow-x-auto max-h-[80vh]"
              style={{
                display: "block",
                position: "relative",
              }}
            >
              {/* Apply sticky styles directly to the table */}
              <Table>
                {/* Make the TableHeader sticky */}
                <TableHeader className="sticky top-0 bg-white z-10 ">
                  <TableRow>
                    {visibleColumns.map((column) => (
                      <TableHead key={column} className="whitespace-nowrap  ">
                        {column}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={visibleColumns.length}
                        className="h-24 text-center"
                      >
                        <div className="flex justify-center items-center">
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Loading data...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredData.length > 0 ? (
                    filteredData.map((row, rowIndex) => (
                      <TableRow key={rowIndex} className="hover:bg-muted/50">
                        {visibleColumns.map((column) => (
                          <TableCell
                            key={`${rowIndex}-${column}`}
                            className="whitespace-nowrap "
                          >
                            {row[column]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={visibleColumns.length}
                        className="h-24 text-center"
                      >
                        No matching records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
}
