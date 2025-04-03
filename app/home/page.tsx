"use client";

import React, { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import supabase from "../supabaseClient"; // Ensure this points to your Supabase setup
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";

ChartJS.register(ArcElement, Tooltip, Legend);

const Home: React.FC = () => {
  const [curUser, setCurUser] = useState<any>({});
  const [piechartData, setPiechartData] = useState<any>(null);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const fetchMeetings = async () => {
    const { data, error } = await supabase.from("Meetings").select();
    if (!error) setMeetings(data || []);
  };

  const buildPieChartData = (userData: any) => {
    const fields = [
      { key: "Cash", label: "Cash" },
      { key: "Current Bonds", label: "Current Bonds" },
      { key: "Current Stocks", label: "Current Stocks" },
      // Add more fields as needed
    ];

    const labels: string[] = [];
    const data: number[] = [];
    const colors: string[] = [
      "#BEADFA",
      "#D0BFFF",
      "#DFCCFB",
      "#E8D8FF",
      "#F1E3FF",
    ];

    fields.forEach(({ key, label }, index) => {
      if (userData[key] > 0) {
        labels.push(label);
        data.push(userData[key]);
      }
    });

    setPiechartData({
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 1,
        },
      ],
    });
  };

  // Check auth status on mount and when page hydrates
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getSession();

        if (!data.session) {
          // No active session, redirect to login
          router.replace("/");
          return;
        }

        setIsAuthenticated(true);
        await fetchUserData();
        await fetchMeetings();
      } catch (error) {
        console.error("Auth check error:", error);
        router.replace("/");
      } finally {
        setLoading(false);
      }
    };

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") {
          router.replace("/");
        } else if (event === "SIGNED_IN" && session) {
          setIsAuthenticated(true);
          fetchUserData();
          fetchMeetings();
        }
      }
    );

    checkAuth();

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  const fetchUserData = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();

      if (!user?.user?.email) {
        return;
      }

      const { data, error } = await supabase.from("Pelicoin balances").select();

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        let userData = null;
        data.forEach((u) => {
          if (u.Email && user.user?.email) {
            if (u.Email.toLowerCase() === user.user?.email.toLowerCase()) {
              userData = u;
            }
          }
        });

        if (userData) {
          setCurUser(userData);
          buildPieChartData(userData);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleSignUp = async (meetingTopic: string, attendees: string[]) => {
    setLoading(true);

    if (
      attendees.includes(curUser["First Name"] + " " + curUser["Last Name"])
    ) {
      alert("Already signed up!");
      setLoading(false);
      return;
    }

    const newAttendees = [
      ...attendees,
      `${curUser["First Name"]} ${curUser["Last Name"]}`,
    ];

    const { error } = await supabase
      .from("Meetings")
      .update({ Attendees: newAttendees })
      .eq("Topic", meetingTopic);

    if (!error) {
      fetchMeetings();
    } else {
      alert("Failed to sign up.");
    }
    setLoading(false);
  };

  // Handle sign out function
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Redirect to login page or home page after sign out
      router.replace("/");
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to sign out. Please try again.");
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Let the router handle the redirect
  }

  return (
    <div
      className="min-h-screen bg-gray-50 p-4"
      style={{ display: "flex", alignItems: "center" }}
    >
      <div
        className="max-w-5xl mx-auto"
        style={{
          position: "relative",
          transform: "translateY(-40px)",
          top: "50%",
          width: "70vw",
        }}
      >
        <header className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">
            Hi, {curUser["First Name"] || "User"}!
          </h1>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="bg-red-50 hover:bg-red-100 text-red-600 border-red-300"
          >
            Sign Out
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="p-4 bg-white shadow rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Portfolio Breakdown</h2>
            {piechartData ? (
              <Pie
                options={{
                  plugins: {
                    legend: {
                      position: "right",
                    },
                  },
                }}
                style={{
                  width: "70%",
                  height: "70%",
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
                data={piechartData}
              />
            ) : (
              <p>No data available</p>
            )}
            <p className="text-center mt-4 font-medium mt-[-30px]">
              Net Worth: {curUser["Net Worth"] || 0} Pelicoin
            </p>
            <div className="flex justify-center">
              <div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="link"
                      className="mr-[auto] ml-[auto] text-blue-600"
                    >
                      View statements
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] overflow-y-scroll max-h-screen">
                    <DialogHeader>
                      <DialogTitle>Statements</DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue="financial" className="w-[100%]">
                      <TabsList className="w-[100%]">
                        <TabsTrigger
                          value="financial"
                          className="w-[100%] font-bold"
                        >
                          Financial Statement
                        </TabsTrigger>
                        <TabsTrigger
                          value="incometax"
                          className="w-[100%] font-bold"
                        >
                          Income/Tax Statement
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="financial">
                        <Table>
                          <TableCaption>Your financial statment.</TableCaption>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[100px]">
                                Overall
                              </TableHead>
                              <TableHead>Specifics</TableHead>
                              <TableHead>Value</TableHead>
                              <TableHead className="text-right">
                                Total
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-bold">
                                Assets
                              </TableCell>
                              <TableCell></TableCell>
                              <TableCell></TableCell>
                              <TableCell className="text-right"></TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                Current
                              </TableCell>
                              <TableCell></TableCell>
                              <TableCell></TableCell>
                              <TableCell className="text-right">
                                {(
                                  curUser["Cash"] +
                                  curUser["Current Stocks"] +
                                  curUser["Current Bonds"]
                                ).toFixed(2) || "N/A"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium"></TableCell>
                              <TableCell>Cash</TableCell>
                              <TableCell>{curUser["Cash"]}</TableCell>
                              <TableCell className="text-right"></TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium"></TableCell>
                              <TableCell>Current Stocks</TableCell>
                              <TableCell>{curUser["Current Stocks"]}</TableCell>
                              <TableCell className="text-right"></TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium"></TableCell>
                              <TableCell>Current Bonds</TableCell>
                              <TableCell>{curUser["Current Bonds"]}</TableCell>
                              <TableCell className="text-right"></TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium"></TableCell>
                              <TableCell>SMG</TableCell>
                              <TableCell>??</TableCell>
                              <TableCell className="text-right"></TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                Year +1
                              </TableCell>
                              <TableCell></TableCell>
                              <TableCell></TableCell>
                              <TableCell className="text-right">
                                {(
                                  curUser["Stocks +1"] + curUser["Bonds +1"]
                                ).toFixed(2) || "N/A"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium"></TableCell>
                              <TableCell>Stocks +1</TableCell>
                              <TableCell>{curUser["Stocks +1"]}</TableCell>
                              <TableCell className="text-right"></TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium"></TableCell>
                              <TableCell>Bonds +1</TableCell>
                              <TableCell>{curUser["Bonds +1"]}</TableCell>
                              <TableCell className="text-right"></TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                Year +2
                              </TableCell>
                              <TableCell></TableCell>
                              <TableCell></TableCell>
                              <TableCell className="text-right">
                                {(
                                  curUser["Stocks +2"] + curUser["Bonds +2"]
                                ).toFixed(2) || "N/A"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium"></TableCell>
                              <TableCell>Stocks +2</TableCell>
                              <TableCell>{curUser["Stocks +2"]}</TableCell>
                              <TableCell className="text-right"></TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium"></TableCell>
                              <TableCell>Bonds +2</TableCell>
                              <TableCell>{curUser["Bonds +2"]}</TableCell>
                              <TableCell className="text-right"></TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                Year +3
                              </TableCell>
                              <TableCell></TableCell>
                              <TableCell></TableCell>
                              <TableCell className="text-right">
                                {(
                                  curUser["Stocks +3"] + curUser["Bonds +3"]
                                ).toFixed(2) || "N/A"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium"></TableCell>
                              <TableCell>Stocks +3</TableCell>
                              <TableCell>{curUser["Stocks +3"]}</TableCell>
                              <TableCell className="text-right"></TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium"></TableCell>
                              <TableCell>Bonds +3</TableCell>
                              <TableCell>{curUser["Bonds +3"]}</TableCell>
                              <TableCell className="text-right"></TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-bold">
                                -Liabilities
                              </TableCell>
                              <TableCell></TableCell>
                              <TableCell></TableCell>
                              <TableCell className="text-right">??</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-bold"></TableCell>
                              <TableCell>Loans payable</TableCell>
                              <TableCell>??</TableCell>
                              <TableCell className="text-right"></TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-bold">
                                Net worth
                              </TableCell>
                              <TableCell></TableCell>
                              <TableCell></TableCell>
                              <TableCell className="text-right">
                                {curUser["Net Worth"]}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TabsContent>
                      <TabsContent value="incometax">
                        <Table>
                          <TableCaption>Your income/tax statment.</TableCaption>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[200px]">Name</TableHead>
                              <TableHead className="text-right">
                                Value
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-bold">
                                Earnings
                              </TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                Wage Income
                              </TableCell>
                              <TableCell className="text-right">
                                {curUser["Wage Income"]}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                +/- Capital Gain/Loss on Current Stocks{" "}
                              </TableCell>
                              <TableCell className="text-right">
                                {curUser["Capital Gains on Current Stocks"]}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                +/- Capital Gain/Loss on SMG{" "}
                              </TableCell>
                              <TableCell className="text-right">??</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                + Interest Income on Current Bonds
                              </TableCell>
                              <TableCell className="text-right">
                                {curUser["Interest Earned on Current Bonds"]}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                + Withdrawals from Tax Deferred Accounts
                              </TableCell>
                              <TableCell className="text-right">
                                {
                                  curUser[
                                    "Withdrawals from Tax Deferred Accounts"
                                  ]
                                }
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                - Deposits to Tax Deferred Accounts
                              </TableCell>
                              <TableCell className="text-right">
                                {curUser["Deposits to Tax Deferred Accounts"]}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-bold">
                                Taxable Income
                              </TableCell>
                              <TableCell className="text-right">
                                {curUser["Taxable Income"]}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                - Tax
                              </TableCell>
                              <TableCell className="text-right">
                                {curUser["Taxes"]}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-bold">
                                Net Income
                              </TableCell>
                              <TableCell className="text-right">
                                {curUser["Net Income"]}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-bold"></TableCell>
                              <TableCell className="text-right"></TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-bold"></TableCell>
                              <TableCell className="text-right"></TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-bold">
                                Beginning Cash Balance
                              </TableCell>
                              <TableCell className="text-right">
                                {curUser["Beginning cash"]}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                + Wage Income
                              </TableCell>
                              <TableCell className="text-right">
                                {curUser["Wage Income"]}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                +/- Capital Gain/Loss in SMG
                              </TableCell>
                              <TableCell className="text-right">??</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                + Grants Received
                              </TableCell>
                              <TableCell className="text-right">
                                {" "}
                                {curUser["Grants Received"]}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                + Loans Received
                              </TableCell>
                              <TableCell className="text-right">
                                {" "}
                                {curUser["Loans"]}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                + Total Stock Sales
                              </TableCell>
                              <TableCell className="text-right">??</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                + Total Bond Sales
                              </TableCell>
                              <TableCell className="text-right">??</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                - Taxes
                              </TableCell>
                              <TableCell className="text-right">
                                {curUser["Taxes"]}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                - Loan Payments
                              </TableCell>
                              <TableCell className="text-right">
                                {curUser["Loan Payments"]}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                - Spending
                              </TableCell>
                              <TableCell className="text-right">
                                {curUser["Spending"]}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                - Fees and Penalties
                              </TableCell>
                              <TableCell className="text-right">
                                {curUser["Fees and Penalties"]}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                - Total Stock Purchases
                              </TableCell>
                              <TableCell className="text-right">??</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                - Total Bond Purchases
                              </TableCell>
                              <TableCell className="text-right">??</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                - SMG
                              </TableCell>
                              <TableCell className="text-right">??</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-bold">
                                Ending Cash
                              </TableCell>
                              <TableCell className="text-right">
                                {curUser["Cash"]}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Meetings */}
          <div className="p-4 bg-white shadow rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Upcoming Meetings</h2>
            {meetings.length > 0 ? (
              <ul className="space-y-4">
                {meetings.map((meeting) => (
                  <li
                    key={meeting.Topic}
                    className="flex justify-between items-center"
                  >
                    <div>
                      <h3 className="font-bold">{meeting.Topic}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(meeting.Date).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      className="ml-4"
                      disabled={
                        meeting.Attendees?.includes(
                          curUser["First Name"] + " " + curUser["Last Name"]
                        ) || loading
                      }
                      onClick={() =>
                        handleSignUp(meeting.Topic, meeting.Attendees || [])
                      }
                    >
                      {meeting.Attendees?.includes(
                        curUser["First Name"] + " " + curUser["Last Name"]
                      )
                        ? "Signed Up"
                        : "Sign Up"}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No upcoming meetings</p>
            )}
          </div>
        </div>

        {/* Ticket Status */}
        <div className="mt-6 p-4 bg-white shadow rounded-lg">
          <h2 className="text-xl font-semibold">Ticket Status</h2>
          <img
            alt="ticket"
            src={curUser["Ticket"] == 1 ? "/ticket.png" : "/tickete.png"}
            style={{
              marginLeft: "auto",
              marginRight: "auto",
              width: "100px",
            }}
          />
          <div style={{ padding: "10px", textAlign: "center" }}>
            {curUser["Ticket"] == 1 ? (
              <>Hooray! You have a ticket for the End-of-Year Celebration! </>
            ) : (
              <>
                Unfortunately, you do not have a ticket for the End-of-Year
                celebration :&#x2768;. Please contact Dr. Fisher to purchase.{" "}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
