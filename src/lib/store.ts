import { supabase } from "@/integrations/supabase/client";

export type EventStatus = "live" | "upcoming" | "sold-out" | "pending";

export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  attendees: number;
  capacity: number;
  image: string;
  images?: string[];
  status: EventStatus;
  category: string;
  description: string;
  organizerId?: string;
}

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  timestamp: string;
}

// Timeout helper to prevent infinite hangs
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 4000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error("Request timed out")), timeoutMs)
    )
  ]);
};

// Helper to determine status based on date and attendees
export const calculateStatus = (event: Partial<Event>): EventStatus => {
  if (event.status === "pending") return "pending";
  if (event.attendees && event.capacity && event.attendees >= event.capacity) return "sold-out";
  
  if (event.date) {
    const eventDate = new Date(event.date);
    const now = new Date();
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 3 && diffDays >= 0) return "live";
    if (diffDays > 3) return "upcoming";
  }
  
  return (event.status as EventStatus) || "upcoming";
};

export const uploadImage = async (file: File): Promise<{ url: string | null; error: string | null }> => {
  try {
    console.log(`Starting upload for ${file.name} (${file.size} bytes)...`);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 10)}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await withTimeout<any>(
      supabase.storage
        .from('event-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })
    );

    if (error) {
      console.error('Supabase storage error:', error);
      return { url: null, error: error.message };
    }

    console.log(`Upload successful for ${file.name}. Retrieving public URL...`);
    const { data: { publicUrl } } = supabase.storage
      .from('event-images')
      .getPublicUrl(filePath);

    return { url: publicUrl, error: null };
  } catch (err: any) {
    console.error('Unexpected upload error:', err);
    return { url: null, error: err.message || "An unexpected error occurred" };
  }
};

export const getEvents = async (): Promise<Event[]> => {
  console.log("Fetching events start...");
  try {
    const response = await withTimeout<any>(
      (supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false })) as any
    );

    const { data, error } = response;

    if (error) {
      console.error("Error fetching events:", error);
      return [];
    }
    console.log(`Fetched ${data?.length || 0} events successfully.`);

    return (data || []).map((e: any) => {
      // Parse images: image column may contain a JSON array of URLs or a single URL
      let allImages: string[] = [];
      if (e.image) {
        try {
          const parsed = JSON.parse(e.image);
          if (Array.isArray(parsed)) allImages = parsed;
          else allImages = [e.image];
        } catch {
          allImages = [e.image];
        }
      }
      if (allImages.length === 0) allImages = ["https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80"];

      return {
        id: e.id,
        title: e.title || "Untitled Event",
        date: e.date,
        location: e.location,
        capacity: e.capacity,
        attendees: e.attendees || 0,
        status: calculateStatus({ ...e, status: e.status as any } as any),
        category: e.category || "General",
        description: e.description || "",
        organizerId: e.organizer_id,
        image: allImages[0],
        images: allImages,
      };
    });
  } catch (err) {
    console.error("Events fetch timeout or error:", err);
    return [];
  }
};

export const saveEvent = async (event: Omit<Event, "id" | "attendees" | "status">, organizerId: string) => {
  // Format date as YYYY-MM-DD for Supabase
  const formattedDate = event.date.includes("T") 
    ? event.date.split("T")[0] 
    : event.date;
  
  console.log("Saving event...", { title: event.title, date: formattedDate, organizerId });
  try {
    const response = await withTimeout<any>(
      (supabase
        .from("events")
        .insert({
          title: event.title,
          description: event.description,
          date: formattedDate,
          location: event.location,
          capacity: event.capacity,
          category: event.category,
          organizer_id: organizerId,
          status: "pending",
          image: JSON.stringify(event.images || [event.image])
        })
        .select()
        .single()) as any,
      8000
    );

    const { data, error } = response;
    if (error) {
      console.error("Supabase saveEvent error:", error);
      throw new Error(error.message);
    }
    console.log("Event saved successfully:", data?.id);
    return data;
  } catch (err: any) {
    console.error("saveEvent failure:", err);
    throw err;
  }
};

export const updateEventStatus = async (eventId: string, status: EventStatus) => {
  try {
    const response = await withTimeout<any>(
      (supabase.from("events").update({ status }).eq("id", eventId)) as any
    );
    if (response.error) throw new Error(response.error.message);
  } catch (err: any) {
    console.error("updateEventStatus error:", err);
    throw err;
  }
};

export const deleteEvent = async (eventId: string) => {
  try {
    const response = await withTimeout<any>(
      (supabase.from("events").delete().eq("id", eventId)) as any
    );
    if (response.error) throw new Error(response.error.message);
  } catch (err: any) {
    console.error("deleteEvent error:", err);
    throw err;
  }
};

export const getRegistrations = async (): Promise<Registration[]> => {
  try {
    const response = await withTimeout<any>(
      (supabase.from("registrations").select("*")) as any
    );
    const { data, error } = response;
    if (error) {
      console.error("Error fetching registrations:", error);
      return [];
    }
    return (data || []).map((r: any) => ({
      id: r.id,
      eventId: r.event_id || "",
      userId: r.user_id || "",
      timestamp: r.created_at || ""
    }));
  } catch (err) {
    console.error("getRegistrations timeout/error:", err);
    return [];
  }
};

export const registerForEvent = async (eventId: string, userId: string) => {
  try {
    // Check if already registered
    const { data: existing } = await withTimeout<any>(
      (supabase.from("registrations").select("id").eq("event_id", eventId).eq("user_id", userId).single()) as any
    );
    if (existing) return { error: "Already registered" };

    // Get current event data
    const eventRes = await withTimeout<any>(
      (supabase.from("events").select("attendees, capacity").eq("id", eventId).single()) as any
    );
    const event = eventRes.data;
    if (eventRes.error || !event) return { error: "Event not found" };
    if ((event.attendees || 0) >= event.capacity) return { error: "Event is full" };

    // Insert registration
    const regRes = await withTimeout<any>(
      (supabase.from("registrations").insert({ event_id: eventId, user_id: userId })) as any
    );
    if (regRes.error) return { error: regRes.error.message };

    // Update attendee count
    const newAttendees = (event.attendees || 0) + 1;
    const updateRes = await withTimeout<any>(
      (supabase.from("events").update({
        attendees: newAttendees,
        status: newAttendees >= event.capacity ? "sold-out" : "upcoming"
      }).eq("id", eventId)) as any
    );
    if (updateRes.error) return { error: updateRes.error.message };

    return { success: true };
  } catch (err: any) {
    console.error("registerForEvent error:", err);
    return { error: err.message || "Registration failed" };
  }
};

export const getPlatformStats = async () => {
  try {
    const userResponse = await withTimeout<any>(
      (supabase
        .from("profiles")
        .select("*", { count: 'exact', head: true })) as any
    );

    const eventResponse = await withTimeout<any>(
      (supabase
        .from("events")
        .select("*", { count: 'exact', head: true })
        .neq("status", "pending")) as any
    );

    return {
      users: userResponse.count || 0,
      events: eventResponse.count || 0
    };
  } catch (error) {
    console.error("Platform stats fetch error:", error);
    return { users: 0, events: 0 };
  }
};

export const getOrganizerEvents = async (organizerId: string): Promise<Event[]> => {
  const all = await getEvents();
  return all.filter(e => e.organizerId === organizerId);
};

export const getUserRegistrations = async (userId: string): Promise<Event[]> => {
  try {
    const { data: regs, error: regsError } = await withTimeout<any>(
      (supabase
        .from("registrations")
        .select("event_id")
        .eq("user_id", userId)) as any
    );

    if (regsError || !regs) return [];
    
    const eventIds = regs.map((r: any) => r.event_id).filter(Boolean) as string[];
    if (eventIds.length === 0) return [];

    const allEvents = await getEvents();
    return allEvents.filter(e => eventIds.includes(e.id));
  } catch (error) {
    console.error("User registrations fetch error:", error);
    return [];
  }
};

export interface EventRegistrant {
  id: string;
  fullName: string;
  email: string;
  registeredAt: string;
}

export const getEventRegistrations = async (eventId: string): Promise<EventRegistrant[]> => {
  try {
    // Fetch registrations for this event
    const regRes = await withTimeout<any>(
      (supabase
        .from("registrations")
        .select("id, user_id, created_at")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false })) as any
    );

    if (regRes.error || !regRes.data || regRes.data.length === 0) return [];

    // Fetch profiles for all registered users
    const userIds = regRes.data.map((r: any) => r.user_id).filter(Boolean);
    const profileRes = await withTimeout<any>(
      (supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds)) as any
    );

    const profileMap: Record<string, string> = {};
    (profileRes.data || []).forEach((p: any) => {
      profileMap[p.id] = p.full_name || "Unknown";
    });

    // We need emails from auth, but we can't access auth.users from client
    // So we'll show the profile name + user_id as identifier
    // For email, we'll try to get it from the auth admin API if available
    // Fallback: use the profile data we have
    return regRes.data.map((r: any) => ({
      id: r.id,
      fullName: profileMap[r.user_id] || "Unknown User",
      email: r.user_id ? `${(profileMap[r.user_id] || "user").toLowerCase().replace(/\s+/g, ".")}@registered` : "",
      registeredAt: r.created_at || "",
    }));
  } catch (err) {
    console.error("getEventRegistrations error:", err);
    return [];
  }
};

