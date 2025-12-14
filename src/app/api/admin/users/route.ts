import { getUsers } from "@coldflow/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // Fetch all users from the coldflow database
    const users = await getUsers()
    return NextResponse.json({
      success: true,
      users,
      count: users.length,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch users",
      },
      { status: 500 }
    );
  }
}
