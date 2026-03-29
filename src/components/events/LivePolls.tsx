import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Check, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface PollOption {
  id: string;
  poll_id: string;
  title: string;
  votesCount: number;
}

interface Poll {
  id: string;
  event_id: string;
  question: string;
  created_by: string;
  created_at: string;
  options: PollOption[];
  userVotedId?: string;
  totalVotes: number;
}

export default function LivePolls({ eventId, isOrganizer }: { eventId: string; isOrganizer: boolean }) {
  const { user } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState(["", ""]);

  useEffect(() => {
    fetchPolls();
    
    // Subscriptions
    const pollsSub = supabase.channel('polls-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'polls', filter: `event_id=eq.${eventId}` }, () => {
        fetchPolls();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes' }, () => {
        fetchPolls();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(pollsSub);
    };
  }, [eventId, user]);

  const fetchPolls = async () => {
    try {
      const { data: pollsData, error: pollsError } = await supabase
        .from('polls')
        .select(`
          id, event_id, question, created_by, created_at,
          poll_options ( id, poll_id, title ),
          poll_votes ( id, option_id, user_id )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (pollsError) throw pollsError;

      const formattedPolls = (pollsData || []).map(p => {
        const votes = p.poll_votes || [];
        const options = (p.poll_options || []).map(opt => ({
          ...opt,
          votesCount: votes.filter(v => v.option_id === opt.id).length
        }));
        
        const totalVotes = votes.length;
        const userVote = votes.find(v => v.user_id === user?.id);

        return {
          ...p,
          options,
          totalVotes,
          userVotedId: userVote?.option_id
        };
      });

      setPolls(formattedPolls as any);
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const addOptionField = () => setNewOptions([...newOptions, ""]);
  
  const updateOptionField = (index: number, val: string) => {
    const opts = [...newOptions];
    opts[index] = val;
    setNewOptions(opts);
  };
  
  const handleCreatePoll = async () => {
    if (!user) return;
    if (!newQuestion.trim() || newOptions.filter(o => o.trim()).length < 2) {
      toast.error("Please provide a question and at least two options.");
      return;
    }

    setCreating(true);
    try {
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert({ event_id: eventId, question: newQuestion.trim(), created_by: user.id })
        .select()
        .single();
      
      if (pollError) throw pollError;

      const optsToInsert = newOptions.filter(o => o.trim()).map(o => ({
        poll_id: poll.id,
        title: o.trim()
      }));

      const { error: optsError } = await supabase
        .from('poll_options')
        .insert(optsToInsert);
      
      if (optsError) throw optsError;

      toast.success("Poll created successfully");
      setNewQuestion("");
      setNewOptions(["", ""]);
      fetchPolls();
    } catch (error) {
      console.error('Error creating poll:', error);
      toast.error("Failed to create poll");
    } finally {
      setCreating(false);
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    if (!user) {
      toast.error("Please sign in to vote");
      return;
    }
    if (isOrganizer) {
      toast.info("Organizers cannot vote on their own polls.");
      return;
    }
    
    try {
      const { error } = await supabase
        .from('poll_votes')
        .insert({ poll_id: pollId, option_id: optionId, user_id: user.id });
      
      if (error) {
        if (error.code === '23505') toast.error("You have already voted on this poll");
        else throw error;
        return;
      }
      toast.success("Vote cast successfully");
      fetchPolls();
    } catch (error) {
      console.error('Error voting:', error);
      toast.error("Failed to cast vote");
    }
  };
  
  const handleDeletePoll = async (pollId: string) => {
    if (!confirm("Are you sure you want to delete this poll?")) return;
    try {
      const { error } = await supabase.from('polls').delete().eq('id', pollId);
      if (error) throw error;
      toast.success("Poll deleted");
      fetchPolls();
    } catch (error) {
      console.error("Failed to delete poll", error);
      toast.error("Failed to delete poll");
    }
  };

  if (loading) {
    return <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary/40" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Live Polls</h2>
          <p className="text-sm text-muted-foreground">Participate in real-time polls</p>
        </div>
      </div>

      {isOrganizer && (
        <Card className="border-border bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Create New Poll</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input 
              placeholder="Ask a question..." 
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
            />
            <div className="space-y-2">
              {newOptions.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input 
                    placeholder={`Option ${i+1}`} 
                    value={opt}
                    onChange={(e) => updateOptionField(i, e.target.value)}
                  />
                  {i >= 2 && (
                    <Button variant="ghost" size="icon" onClick={() => setNewOptions(newOptions.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" onClick={addOptionField} className="gap-1.5 cursor-pointer">
                <Plus className="h-3.5 w-3.5" /> Add Option
              </Button>
              <Button size="sm" onClick={handleCreatePoll} disabled={creating} className="active-press">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish Poll"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {polls.length === 0 && !loading && (
        <div className="text-center py-8 bg-card/30 rounded-xl border border-border border-dashed">
          <p className="text-sm text-muted-foreground">No active polls for this event.</p>
        </div>
      )}

      <div className="space-y-4">
        <AnimatePresence>
          {polls.map(poll => (
            <motion.div key={poll.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
              <Card className="border-border bg-card overflow-hidden relative">
                {isOrganizer && (
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeletePoll(poll.id)} z-index="20">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
                <CardHeader className="pb-3 pr-10">
                  <CardTitle className="text-base leading-tight">{poll.question}</CardTitle>
                  <CardDescription className="text-xs">{poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {poll.options.map(opt => {
                    const percentage = poll.totalVotes > 0 ? Math.round((opt.votesCount / poll.totalVotes) * 100) : 0;
                    const isVoted = poll.userVotedId === opt.id;
                    const hasVoted = !!poll.userVotedId;
                    
                    return (
                      <div key={opt.id} className="space-y-1.5 relative">
                        <button
                          disabled={hasVoted || !user || isOrganizer}
                          onClick={() => handleVote(poll.id, opt.id)}
                          className={`w-full text-left relative overflow-hidden rounded-md border p-3 flex items-center justify-between transition-colors
                            ${isVoted ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-secondary/50'}
                            ${hasVoted || isOrganizer ? 'cursor-default' : 'cursor-pointer active:scale-[0.98]'}
                          `}
                        >
                          <div className={`absolute left-0 top-0 bottom-0 bg-primary/10 transition-all duration-500`} style={{ width: hasVoted || isOrganizer ? `${percentage}%` : '0%' }} />
                          <span className={`relative z-10 text-sm font-medium ${isVoted ? 'text-primary' : ''}`}>
                            {opt.title}
                          </span>
                          <div className="relative z-10 flex items-center gap-2">
                            {(hasVoted || isOrganizer) && <span className="text-xs font-semibold">{percentage}%</span>}
                            {isVoted && <Check className="h-4 w-4 text-primary" />}
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
