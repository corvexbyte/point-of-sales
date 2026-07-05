// app/api/users/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabaseServer = await createServerClient();
    const { data: { user: adminUser } } = await supabaseServer.auth.getUser();

    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if requester is admin
    const { data: profile } = await supabaseServer
      .from("profiles")
      .select("role")
      .eq("id", adminUser.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email, password, full_name, role } = await request.json();

    if (!email || !password || !full_name || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create a client with persistSession: false so it doesn't modify admin cookies
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await tempClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          role,
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 400 });
    }

    // Update profile role & full_name (trigger handle_new_user defaults to cashier)
    // We override it with the requested role
    const { error: profileError } = await supabaseServer
      .from("profiles")
      .update({ role, full_name })
      .eq("id", data.user.id);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, userId: data.user.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
