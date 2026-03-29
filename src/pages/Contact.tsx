import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, Save, Edit2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Contact() {
  const { user, userRole } = useAuth();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingId, setSettingId] = useState<string | null>(null);

  const isAdmin = userRole === "admin";

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setEmail(data.contact_email || "");
        setPhone(data.contact_phone || "");
        setSettingId(data.id);
      }
    } catch (error: any) {
      console.error("Failed to fetch contact info", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (settingId) {
        const { error } = await supabase
          .from("site_settings")
          .update({ contact_email: email, contact_phone: phone, updated_at: new Date().toISOString() })
          .eq("id", settingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("site_settings")
          .insert({ contact_email: email, contact_phone: phone })
          .select()
          .single();
        if (error) throw error;
        if (data) setSettingId(data.id);
      }
      toast.success("Contact info updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save contact info", error);
      toast.error("Failed to save contact info");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container max-w-2xl py-24 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Contact Us</h1>
            <p className="text-muted-foreground">Get in touch with the EventSphere team.</p>
          </div>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>We're here to help.</CardDescription>
              </div>
              {isAdmin && !isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6 mt-4">
              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-10 bg-muted rounded"></div>
                  <div className="h-10 bg-muted rounded"></div>
                </div>
              ) : isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Support Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="ghost" onClick={() => {
                      setIsEditing(false);
                      fetchContactInfo(); // Reset values
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                      <Save className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/50">
                    <div className="bg-primary/10 p-2 rounded text-primary">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none mb-1">Email</p>
                      <a href={`mailto:${email || "info@example.com"}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        {email || "info@example.com"}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/50">
                    <div className="bg-primary/10 p-2 rounded text-primary">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none mb-1">Phone</p>
                      <a href={`tel:${phone || "+1234567890"}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        {phone || "+1234567890"}
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
