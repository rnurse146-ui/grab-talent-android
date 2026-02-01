import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles, Search, Star, Calendar, MessageSquare,
  Users, Settings, ChevronRight, Clock, MapPin,
  TrendingUp, Eye, Heart, CheckCircle2
} from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [talentProfile, setTalentProfile] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [maybeList, setMaybeList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (!currentUser.onboarding_complete) {
        window.location.href = createPageUrl('Onboarding');
        return;
      }

      // Load talent profile if user is a talent
      if (currentUser.user_type === 'talent' || currentUser.user_type === 'both') {
        const profiles = await base44.entities.TalentProfile.filter({ user_id: currentUser.id });
        if (profiles.length > 0) {
          setTalentProfile(profiles[0]);
        }
      }

      // Load recent bookings
      const bookings = await base44.entities.Booking.filter(
        { $or: [{ seeker_id: currentUser.id }, { talent_user_id: currentUser.id }] },
        '-created_date',
        5
      );
      setRecentBookings(bookings);

      // Load maybe list for seekers
      if (currentUser.user_type === 'seeker' || currentUser.user_type === 'both') {
        const maybe = await base44.entities.MaybeList.filter({ seeker_id: currentUser.id }, '-created_date', 5);
        setMaybeList(maybe);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isTalent = user?.user_type === 'talent' || user?.user_type === 'both';
  const isSeeker = user?.user_type === 'seeker' || user?.user_type === 'both';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/50 to-orange-900/30 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">
                Welcome back, {user?.full_name?.split(' ')[0] || 'there'}! 👋
              </h1>
              <p className="text-slate-400">
                {isTalent && isSeeker 
                  ? "Manage your talent profile and find performers"
                  : isTalent 
                    ? "Manage your bookings and grow your career"
                    : "Find amazing talent for your events"}
              </p>
            </div>
            <div className="flex gap-3">
              {isSeeker && (
                <Link to={createPageUrl('Discover')}>
                  <Button className="bg-purple-600 hover:bg-purple-500">
                    <Search className="w-4 h-4 mr-2" />
                    Discover Talent
                  </Button>
                </Link>
              )}
              {isTalent && !talentProfile && (
                <Link to={createPageUrl('TalentSetup')}>
                  <Button className="bg-orange-600 hover:bg-orange-500">
                    <Star className="w-4 h-4 mr-2" />
                    Create Profile
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {isSeeker && (
                <>
                  <Link to={createPageUrl('Discover')}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-5 rounded-2xl bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-500/30 cursor-pointer"
                    >
                      <Search className="w-8 h-8 text-purple-400 mb-3" />
                      <h3 className="font-semibold mb-1">Discover</h3>
                      <p className="text-sm text-slate-400">Swipe through talent</p>
                    </motion.div>
                  </Link>
                  <Link to={createPageUrl('MaybeList')}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-5 rounded-2xl bg-gradient-to-br from-pink-900/50 to-pink-800/30 border border-pink-500/30 cursor-pointer"
                    >
                      <Heart className="w-8 h-8 text-pink-400 mb-3" />
                      <h3 className="font-semibold mb-1">Maybe List</h3>
                      <p className="text-sm text-slate-400">{maybeList.length} saved talents</p>
                    </motion.div>
                  </Link>
                </>
              )}
              {isTalent && (
                <>
                  <Link to={createPageUrl('TalentCalendar')}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-5 rounded-2xl bg-gradient-to-br from-orange-900/50 to-orange-800/30 border border-orange-500/30 cursor-pointer"
                    >
                      <Calendar className="w-8 h-8 text-orange-400 mb-3" />
                      <h3 className="font-semibold mb-1">Calendar</h3>
                      <p className="text-sm text-slate-400">Manage availability</p>
                    </motion.div>
                  </Link>
                  <Link to={createPageUrl('TalentProfile') + `?id=${talentProfile?.id || ''}`}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-5 rounded-2xl bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 border border-emerald-500/30 cursor-pointer"
                    >
                      <Eye className="w-8 h-8 text-emerald-400 mb-3" />
                      <h3 className="font-semibold mb-1">My Profile</h3>
                      <p className="text-sm text-slate-400">View & edit</p>
                    </motion.div>
                  </Link>
                </>
              )}
              <Link to={createPageUrl('Messages')}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-5 rounded-2xl bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-500/30 cursor-pointer"
                >
                  <MessageSquare className="w-8 h-8 text-blue-400 mb-3" />
                  <h3 className="font-semibold mb-1">Messages</h3>
                  <p className="text-sm text-slate-400">Chat with {isTalent ? 'clients' : 'talent'}</p>
                </motion.div>
              </Link>
            </div>

            {/* Recent Bookings */}
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Recent Bookings</h2>
                <Link to={createPageUrl('Bookings')}>
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                    View all <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>

              {recentBookings.length === 0 ? (
                <div className="text-center py-10">
                  <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No bookings yet</p>
                  {isSeeker && (
                    <Link to={createPageUrl('Discover')}>
                      <Button className="mt-4 bg-purple-600 hover:bg-purple-500">
                        Find Talent
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <Link key={booking.id} to={createPageUrl('BookingDetails') + `?id=${booking.id}`}>
                      <motion.div
                        whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                        className="flex items-center gap-4 p-4 rounded-xl border border-slate-800 cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600/20 to-orange-600/20 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{booking.event_name || 'Event'}</h4>
                          <p className="text-sm text-slate-400">
                            {booking.talent_stage_name} • {booking.event_date}
                          </p>
                        </div>
                        <Badge className={
                          booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                          booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          booking.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-slate-500/20 text-slate-400'
                        }>
                          {booking.status}
                        </Badge>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Talent Profile Stats */}
            {isTalent && talentProfile && (
              <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  Profile Stats
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold">{talentProfile.average_rating?.toFixed(1) || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Reviews</span>
                    <span className="font-semibold">{talentProfile.total_reviews || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Bookings</span>
                    <span className="font-semibold">{talentProfile.total_bookings || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Verified</span>
                    {talentProfile.is_verified ? (
                      <Badge className="bg-green-500/20 text-green-400">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Yes
                      </Badge>
                    ) : (
                      <Link to={createPageUrl('Verification')}>
                        <Badge className="bg-yellow-500/20 text-yellow-400 cursor-pointer hover:bg-yellow-500/30">
                          Get Verified
                        </Badge>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Maybe List Preview (for seekers) */}
            {isSeeker && maybeList.length > 0 && (
              <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-400" />
                    Maybe List
                  </h3>
                  <Link to={createPageUrl('MaybeList')}>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white text-xs">
                      View all
                    </Button>
                  </Link>
                </div>
                <div className="space-y-3">
                  {maybeList.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden">
                        {item.talent_photo ? (
                          <img src={item.talent_photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">
                            <Users className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.talent_stage_name}</p>
                        <p className="text-xs text-slate-400">{item.talent_category?.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link to={createPageUrl('Bookings')}>
                  <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800">
                    <Calendar className="w-4 h-4 mr-3" />
                    All Bookings
                  </Button>
                </Link>
                <Link to={createPageUrl('Messages')}>
                  <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800">
                    <MessageSquare className="w-4 h-4 mr-3" />
                    Messages
                  </Button>
                </Link>
                <Link to={createPageUrl('Settings')}>
                  <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800">
                    <Settings className="w-4 h-4 mr-3" />
                    Settings
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}