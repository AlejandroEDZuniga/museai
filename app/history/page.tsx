'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Calendar, Play, Trash2, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { handleGlobalSignOut } from '@/lib/auth/signOut';

export default function HistoryPage() {
  const router = useRouter();
  const [scans, setScans] = useState<any[]>([]);
  const [filteredScans, setFilteredScans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchScans();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredScans(scans);
    } else {
      const filtered = scans.filter(scan =>
        scan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scan.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredScans(filtered);
    }
  }, [searchQuery, scans]);

  const fetchScans = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScans(data || []);
      setFilteredScans(data || []);
    } catch (error) {
      console.error('Error fetching scans:', error);
      toast.error('Error loading scan history');
    } finally {
      setIsLoading(false);
    }
  };


const handleSignOut = async () => {
  if (isLoggingOut) return;

  setIsLoggingOut(true);
  await handleGlobalSignOut({
    router,
    toast
  });
  setIsLoggingOut(false);
};
const deleteScan = async (scanId: string) => {
    try {
      const { error } = await supabase
        .from('scans')
        .delete()
        .eq('id', scanId);

      if (error) throw error;
      
      setScans(scans.filter(scan => scan.id !== scanId));
      toast.success('Scan deleted successfully');
    } catch (error) {
      console.error('Error deleting scan:', error);
      toast.error('Error deleting scan');
    }
  };

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play().catch(error => {
      console.error('Error playing audio:', error);
      toast.error('Error playing audio');
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
        <motion.div
          className="flex flex-col items-center space-y-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-300/30 border-t-emerald-400"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-400/20 to-teal-400/20 blur-xl"></div>
          </div>
          <p className="text-emerald-100 font-medium">Loading scan history...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                disabled={isLoggingOut}
                className="text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 transition-all duration-300"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Image
                src="/images/LogoMuseAI.png"
                alt="MuseAI Logo"
                width={24}
                height={24}
                className="h-6 w-6 object-contain filter drop-shadow-lg"
                priority
                quality={95}
              />
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 bg-clip-text text-transparent">Scan History</h1>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 transition-all duration-300 disabled:opacity-50"
              aria-label="Sign out"
            >
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search your scans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isLoggingOut}
              className="pl-10 bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-gray-400 focus:border-emerald-400 focus:ring-emerald-400/20 shadow-md"
            />
          </div>
        </div>

        {/* Scans Grid */}
        {filteredScans.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-emerald-400/50 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              {searchQuery ? 'No matching scans found' : 'No scans yet'}
            </h2>
            <p className="text-gray-300 mb-6">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Start by capturing your first artwork!'
              }
            </p>
            {!searchQuery && (
              <Button
                onClick={() => router.push('/capture')}
                disabled={isLoggingOut}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Capture Artwork
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScans.map((scan) => (
              <Card 
                key={scan.id} 
                className="bg-white/10 backdrop-blur-md border-0 shadow-lg hover:shadow-xl transition-shadow duration-200 cursor-pointer border border-white/20"
                onClick={() => !isLoggingOut && router.push(`/result?scanId=${scan.id}`)}
              >
                <CardHeader className="p-0">
                  <div className="relative">
                    <img
                      src={scan.image_url}
                      alt={scan.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <div className="absolute top-2 right-2 flex space-x-1">
                   
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isLoggingOut}
                        className="bg-red-500/80 backdrop-blur-sm hover:bg-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isLoggingOut && confirm('Are you sure you want to delete this scan?')) {
                            deleteScan(scan.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="text-lg font-semibold text-white mb-2 line-clamp-2">
                    {scan.title}
                  </CardTitle>
                  <p className="text-sm text-gray-300 mb-3 line-clamp-3">
                    {scan.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{formatDate(scan.created_at)}</span>
                    <span className="bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full border border-emerald-400/30">
                      {scan.language.toUpperCase()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}