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
import { Analytics } from "@vercel/analytics/react";
const columnHeaders = [
  "Student",
  "Internal Email",
  "External Email",
  "Grad Year",
  "Wage Tier",
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
  "Capital Gain/Loss on Current Stocks",
  "Capital Gain/Loss in SMG",
  "Interest Earned on Current Bonds",
  "Withdrawals from Tax Deferred Accounts",
  "Deposits to Tax Deferred Accounts",
  "Deductible Charitable Donations",
  "Taxable Income",
  "Payroll Tax",
  "Base Income Tax",
  "Tax on Withdrawal",
  "Net Income",
  "Last Year's Ending Cash Balance",
  "Rollover Tax",
  "Beginning Cash",
  "Add Gross Wage Income",
  "New Loans",
  "Grants Received",
  "Loan Payments",
  "Spending",
  "Sales Tax",
  "Charitable Donations",
  "Fees and Penalties",
  "Ending Cash Balance",
  "Total Stock Purchases",
  "Total Stock Sales",
  "Total Bond Purchases",
  "Total Bond Sales",
  "Celebration Ticket",
  "Transfers In",
  "Transfers Out",
  "Additional Taxes on All Capital Gains",
  "Additional Taxes on All Interest Earned",
  "Total Taxes Collected",
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
  const [supabaseData, setSupabaseData] = useState([]);

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
          ); // this is the original data from Supabase which isn't updated if we upload a CSV

          setSupabaseData(
            data.sort((a,b) =>
              a.Student.toLowerCase().localeCompare(b.Student.toLowerCase())
            )
          ); // since dataArray gets changed on upload, this is an archive to compare from
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
    const file = event.target.files?.[0];
    const fileInput = event.target;
  
    if (!file) return;
  
    Papa.parse(file, {
      header: true,
      skipEmptyLines: "greedy",
  
      // Removes extra spaces and a possible hidden markers
      transformHeader: (header) =>
        header.replace(/^\uFEFF/, "").trim(),
  
      complete: async (result) => {
        try {
          const { data, errors, meta } = result;
  
          if (errors.length > 0) {
            console.error("CSV parsing errors:", errors);
            toast.error("The CSV could not be parsed.");
            return;
          }
  
          const uploadedHeaders = (meta.fields || []).filter(Boolean);
  
          const missingColumns = columnHeaders.filter(
            (column) => !uploadedHeaders.includes(column)
          );
  
          if (missingColumns.length > 0) {
            console.error("Missing CSV columns:", missingColumns);
            toast.error(
              `Missing required column${
                missingColumns.length === 1 ? "" : "s"
              }: ${missingColumns.join(", ")}`
            );
            return;
          }
  
          const unexpectedColumns = uploadedHeaders.filter(
            (column) => !columnHeaders.includes(column)
          );
  
          if (unexpectedColumns.length > 0) {
            console.error("Unexpected CSV columns:", unexpectedColumns);
            toast.error(
              `Unexpected column${
                unexpectedColumns.length === 1 ? "" : "s"
              }: ${unexpectedColumns.join(", ")}`
            );
            return;
          }
  
          const normalizedData = data
            .filter((row) => {
              const student = String(row.Student || "").trim();
  
              return (
                student !== "" &&
                student.toLowerCase() !== "total"
              );
            })
            .map((row, index) => {
              const normalizedRow = {};
  
              columnHeaders.forEach((column) => {
                const rawValue = String(row[column] ?? "").trim();
  
                if (textColumns.has(column)) {
                  // Text fields remain blank instead of becoming "0"
                  normalizedRow[column] = rawValue;
                  return;
                }
  
                if (rawValue === "") {
                  normalizedRow[column] = 0;
                  return;
                }
  
                // Supports values such as 1,234.50, $1,234.50, and (123.45)
                const isNegative =
                  rawValue.startsWith("(") &&
                  rawValue.endsWith(")");
  
                const cleanedValue = rawValue
                  .replace(/[$,%\s,]/g, "")
                  .replace(/[()]/g, "");
  
                const numericValue = Number(cleanedValue);
  
                if (!Number.isFinite(numericValue)) {
                  throw new Error(
                    `Invalid number in CSV row ${
                      index + 2
                    }, column "${column}": "${rawValue}"`
                  );
                }
  
                normalizedRow[column] = isNegative
                  ? -numericValue
                  : numericValue;
              });
  
              return normalizedRow;
            })
            .sort((a, b) =>
              a.Student.toLowerCase().localeCompare(
                b.Student.toLowerCase()
              )
            );
  
          if (normalizedData.length === 0) {
            toast.error("The CSV contains no student records.");
            return;
          }
  
          // Student is the database primary key
          const seenStudents = new Set();
          const duplicateStudents = new Set();
  
          normalizedData.forEach((row) => {
            const normalizedStudent = row.Student
              .trim()
              .toLowerCase();
  
            if (seenStudents.has(normalizedStudent)) {
              duplicateStudents.add(row.Student);
            }
  
            seenStudents.add(normalizedStudent);
          });
  
          if (duplicateStudents.size > 0) {
            toast.error(
              `Duplicate student name${
                duplicateStudents.size === 1 ? "" : "s"
              }: ${Array.from(duplicateStudents).join(", ")}`
            );
            return;
          }
  
          const csvStudents = new Set(
            normalizedData.map((row) => row.Student.trim().toLowerCase())
          );
  
          const removedStudents = supabaseData
            .map((row) => row.Student)
            .filter(
              (student) =>
                student && !csvStudents.has(student.trim().toLowerCase())
            );
  
          // Ask before making any database changes.
          if (removedStudents.length > 0) {
            const preview = removedStudents
              .slice(0, 10)
              .join("\n");
  
            const remainingCount =
              removedStudents.length - 10;
  
            const confirmed = window.confirm(
              `${removedStudents.length} student${
                removedStudents.length === 1 ? "" : "s"
              } from Supabase are absent from this CSV and will be deleted:\n\n` +
                preview +
                (remainingCount > 0
                  ? `\n...and ${remainingCount} more`
                  : "") +
                "\n\nContinue with the upload?"
            );
  
            if (!confirmed) {
              toast("Upload cancelled. No data was changed.");
              return;
            }
          }
  
          // Upsert first. Nothing is deleted if the upsert fails.
          const { error: upsertError } = await supabase
            .from("Pelicoin balances")
            .upsert(normalizedData, {
              onConflict: "Student",
            });
  
          if (upsertError) {
            console.error(
              "Error updating Supabase:",
              upsertError
            );
            toast.error(upsertError.message);
            return;
          }
  
          if (removedStudents.length > 0) {
            const { error: deleteError } = await supabase
              .from("Pelicoin balances")
              .delete()
              .in("Student", removedStudents);
  
            if (deleteError) {
              console.error(
                "CSV uploaded, but absent students were not deleted:",
                deleteError
              );
              toast.error(
                `Data uploaded, but deletion failed: ${deleteError.message}`
              );
  
              setDataArray(normalizedData);
              setSupabaseData(normalizedData);
              return;
            }
          }
  
          setDataArray(normalizedData);
          setSupabaseData(normalizedData);
          toast.success("CSV uploaded successfully.");
        } catch (error) {
          console.error("Unexpected CSV upload error:", error);
  
          toast.error(
            error instanceof Error
              ? error.message
              : "An unexpected upload error occurred."
          );
        } finally {
          // Allows the same file to be selected again.
          fileInput.value = "";
        }
      },
  
      error: (error) => {
        console.error("Unable to read CSV:", error);
        toast.error("The CSV file could not be read.");
        fileInput.value = "";
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
      <Analytics />

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
