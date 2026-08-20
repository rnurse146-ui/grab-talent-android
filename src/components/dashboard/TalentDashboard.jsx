import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import {
  Star, Calendar, MessageSquare, Eye, TrendingUp,
  CheckCircle2, ChevronRight, Settings, Shield, Pencil
} from 'lucide-react';
import TalentCalendar from './TalentCalendar';

export default function TalentDashboard({ user, talentProfile, recentBookings }) {
  const pendingBookings = recentBookings.filter(b => b.status === 'pending');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    base44.entities.Message.filter({ receiver_id: user.id, is_read: false }).then(msgs => setUnreadCount(msgs.length));
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.type === 'create' && event.data?.receiver_id === user.id) setUnreadCount(prev => prev + 1);
      if (event.type === 'update' && event.data?.is_read && event.data?.receiver_id === user.id) setUnreadCount(prev => Math.max(0, prev - 1));
    });
    return () => unsub();
  }, [user]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden mb-8 bg-zinc-900 border border-zinc-700 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="text-zinc-400 font-medium mb-2">Welcome back, {user?.full_name?.split(' ')[0]} 🎭</p>
            <h1 className="text-3xl font-bold mb-3">Your Talent Dashboard</h1>
            <p className="text-zinc-500 max-w-md">Manage bookings, showcase your talent, and grow your audience.</p>
          </div>
          {!talentProfile ? (
            <Link to={createPageUrl('TalentSetup')}>
              <Button className="bg-white text-black hover:bg-zinc-100 h-12 px-6 text-base font-semibold shrink-0">
                <Star className="w-5 h-5 mr-2" />
                Create Profile
              </Button>
            </Link>
          ) : (
            pendingBookings.length > 0 && (
              <div className="bg-zinc-800 border border-zinc-600 rounded-2xl px-5 py-4 shrink-0 text-center">
                <p className="text-2xl font-bold text-white">{pendingBookings.length}</p>
                <p className="text-zinc-400 text-sm">Pending {pendingBookings.length === 1 ? 'Request' : 'Requests'}</p>
              </div>
            )
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Actions */}
          <div>
            <h2 className="font-semibold text-lg mb-4">Manage</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Link to={`/TalentSetup?edit=true`}>
                <motion.div whileHover={{ scale: 1.02 }} className="p-5 rounded-2xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 cursor-pointer h-full transition-colors">
                  <Pencil className="w-8 h-8 text-white mb-3" />
                  <h3 className="font-semibold mb-1">Edit Profile</h3>
                  <p className="text-sm text-zinc-500">Bio, photos, videos</p>
                </motion.div>
              </Link>
              {talentProfile?.id ? (
                <Link to={`/TalentProfile?id=${talentProfile.id}`}>
                  <motion.div whileHover={{ scale: 1.02 }} className="p-5 rounded-2xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 cursor-pointer h-full transition-colors">
                    <Eye className="w-8 h-8 text-white mb-3" />
                    <h3 className="font-semibold mb-1">My Profile</h3>
                    <p className="text-sm text-zinc-500">How others see you</p>
                  </motion.div>
                </Link>
              ) : (
                <Link to="/TalentSetup">
                  <motion.div whileHover={{ scale: 1.02 }} className="p-5 rounded-2xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 cursor-pointer h-full transition-colors">
                    <Eye className="w-8 h-8 text-white mb-3" />
                    <h3 className="font-semibold mb-1">My Profile</h3>
                    <p className="text-sm text-zinc-500">Set up your profile first</p>
                  </motion.div>
                </Link>
              )}
              <Link to={createPageUrl('Messages')}>
                <motion.div whileHover={{ scale: 1.02 }} className="p-5 rounded-2xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 cursor-pointer h-full transition-colors">
                  <MessageSquare className="w-8 h-8 text-white mb-3" />
                  <h3 className="font-semibold mb-1">Messages</h3>
                  <p className="text-sm text-zinc-500">Chat with clients</p>
                </motion.div>
              </Link>
              <Link to="/TalentAvailability">
                <motion.div whileHover={{ scale: 1.02 }} className="p-5 rounded-2xl bg-purple-900/40 border border-purple-700/60 hover:border-purple-500 cursor-pointer h-full transition-colors">
                  <Calendar className="w-8 h-8 text-purple-400 mb-3" />
                  <h3 className="font-semibold mb-1">Availability</h3>
                  <p className="text-sm text-zinc-500">Block / open dates</p>
                </motion.div>
              </Link>
            </div>
          </div>

          {/* Pending Requests */}
          {pendingBookings.length > 0 && (
            <div className="bg-zinc-900 rounded-2xl border border-zinc-700 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                <Calendar className="w-5 h-5" />
                Pending Requests ({pendingBookings.length})
              </h2>
              <div className="space-y-3">
                {pendingBookings.map((booking) => (
                  <Link key={booking.id} to={createPageUrl('BookingDetails') + `?id=${booking.id}`}>
                    <motion.div whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }} className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-950/50 cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{booking.event_name || 'Event'}</h4>
                        <p className="text-sm text-zinc-500">By {booking.seeker_name} • {booking.event_date}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-zinc-500">{booking.duration_hours}h</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-600" />
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Calendar */}
          <TalentCalendar bookings={recentBookings} />

          {/* Recent Bookings List */}
          <div className="bg-zinc-900 rounded-2xl border border-zinc-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">All Recent Bookings</h2>
              <Link to={createPageUrl('Bookings')}>
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                  View all <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            {recentBookings.length === 0 ? (
              <div className="text-center py-10">
                <Calendar className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">No bookings yet</p>
                <p className="text-sm text-zinc-600 mt-1">Complete your profile to start getting booked</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((booking) => (
                  <Link key={booking.id} to={createPageUrl('BookingDetails') + `?id=${booking.id}`}>
                    <motion.div whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }} className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800 cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{booking.event_name || 'Event'}</h4>
                        <p className="text-sm text-zinc-500">{booking.seeker_name} • {booking.event_date}</p>
                      </div>
                      <Badge className={
                        booking.status === 'confirmed' ? 'bg-white/20 text-white' :
                        booking.status === 'pending' ? 'bg-zinc-700 text-zinc-300' :
                        booking.status === 'completed' ? 'bg-white/10 text-zinc-300' :
                        'bg-zinc-800 text-zinc-500'
                      }>{booking.status}</Badge>
                    </motion.div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Stats */}
          {talentProfile && (
            <div className="bg-zinc-900 rounded-2xl border border-zinc-700 p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-zinc-400" />
                My Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-white fill-white" />
                    <span className="font-semibold">{talentProfile.average_rating?.toFixed(1) || 'N/A'}</span>
                    <span className="text-zinc-600 text-xs">({talentProfile.total_reviews || 0})</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Total Bookings</span>
                  <span className="font-semibold">{talentProfile.total_bookings || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Rate</span>
                  <span className="font-semibold text-white">£{talentProfile.hourly_rate}/hr</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Verified</span>
                  {talentProfile.is_verified ? (
                    <Badge className="bg-white/20 text-white">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Yes
                    </Badge>
                  ) : (
                    <Link to={createPageUrl('Verification')}>
                      <Badge className="bg-zinc-700 text-zinc-300 cursor-pointer hover:bg-zinc-600">
                        Get Verified
                      </Badge>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}


          {/* Quick Links */}
          <div className="bg-zinc-900 rounded-2xl border border-zinc-700 p-6">
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <div className="space-y-1">
              {[
                { to: '/TalentSetup?edit=true', icon: Pencil, label: 'Edit Profile' },
                { to: '/TalentAvailability', icon: Calendar, label: 'Manage Availability' },
                { to: '/Verification', icon: Shield, label: 'Verification' },
                { to: '/Bookings', icon: Calendar, label: 'All Bookings' },
                { to: '/Messages', icon: MessageSquare, label: 'Messages', badge: unreadCount },
                { to: '/Settings', icon: Settings, label: 'Settings' },
              ].map(({ to, icon: Icon, label, badge }) => (
                <Link key={to} to={to}>
                  <Button variant="ghost" className="w-full justify-start text-zinc-400 hover:text-white hover:bg-zinc-800">
                    <Icon className="w-4 h-4 mr-3" />
                    <span className="flex-1 text-left">{label}</span>
                    {badge > 0 && <span className="ml-auto bg-white text-black text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{badge}</span>}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}