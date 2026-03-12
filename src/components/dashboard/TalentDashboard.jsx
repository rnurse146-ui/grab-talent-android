import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Star, Calendar, MessageSquare, Eye, TrendingUp,
  CheckCircle2, ChevronRight, Settings, Shield
} from 'lucide-react';

export default function TalentDashboard({ user, talentProfile, recentBookings }) {
  const pendingBookings = recentBookings.filter(b => b.status === 'pending');
  const upcomingBookings = recentBookings.filter(b => ['accepted', 'confirmed'].includes(b.status));

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden mb-8 bg-gradient-to-br from-orange-900 via-orange-800/60 to-slate-900 border border-orange-500/20 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="text-orange-300 font-medium mb-2">Welcome back, {user?.full_name?.split(' ')[0]} 🎭</p>
            <h1 className="text-3xl font-bold mb-3">Your Talent Dashboard</h1>
            <p className="text-slate-400 max-w-md">Manage your bookings, update your profile, and grow your career.</p>
          </div>
          {!talentProfile && (
            <Link to={createPageUrl('TalentSetup')}>
              <Button className="bg-orange-600 hover:bg-orange-500 h-12 px-6 text-base shrink-0">
                <Star className="w-5 h-5 mr-2" />
                Create Profile
              </Button>
            </Link>
          )}
          {talentProfile && pendingBookings.length > 0 && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-2xl px-5 py-4 shrink-0 text-center">
              <p className="text-2xl font-bold text-yellow-400">{pendingBookings.length}</p>
              <p className="text-yellow-300 text-sm">Pending {pendingBookings.length === 1 ? 'Request' : 'Requests'}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Actions */}
          <div>
            <h2 className="font-semibold text-lg mb-4">Manage</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Link to={createPageUrl('TalentProfile') + `?id=${talentProfile?.id || ''}`}>
                <motion.div whileHover={{ scale: 1.02 }} className="p-5 rounded-2xl bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 border border-emerald-500/30 cursor-pointer h-full">
                  <Eye className="w-8 h-8 text-emerald-400 mb-3" />
                  <h3 className="font-semibold mb-1">My Profile</h3>
                  <p className="text-sm text-slate-400">View & edit</p>
                </motion.div>
              </Link>
              <Link to={createPageUrl('Bookings')}>
                <motion.div whileHover={{ scale: 1.02 }} className="p-5 rounded-2xl bg-gradient-to-br from-orange-900/50 to-orange-800/30 border border-orange-500/30 cursor-pointer h-full">
                  <Calendar className="w-8 h-8 text-orange-400 mb-3" />
                  <h3 className="font-semibold mb-1">Bookings</h3>
                  <p className="text-sm text-slate-400">{pendingBookings.length} pending</p>
                </motion.div>
              </Link>
              <Link to={createPageUrl('Messages')}>
                <motion.div whileHover={{ scale: 1.02 }} className="p-5 rounded-2xl bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-500/30 cursor-pointer h-full">
                  <MessageSquare className="w-8 h-8 text-blue-400 mb-3" />
                  <h3 className="font-semibold mb-1">Messages</h3>
                  <p className="text-sm text-slate-400">Chat with clients</p>
                </motion.div>
              </Link>
            </div>
          </div>

          {/* Pending Requests */}
          {pendingBookings.length > 0 && (
            <div className="bg-yellow-500/10 rounded-2xl border border-yellow-500/20 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-yellow-400">
                <Calendar className="w-5 h-5" />
                Pending Requests ({pendingBookings.length})
              </h2>
              <div className="space-y-3">
                {pendingBookings.map((booking) => (
                  <Link key={booking.id} to={createPageUrl('BookingDetails') + `?id=${booking.id}`}>
                    <motion.div whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }} className="flex items-center gap-4 p-4 rounded-xl border border-yellow-500/20 bg-slate-900/50 cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{booking.event_name || 'Event'}</h4>
                        <p className="text-sm text-slate-400">By {booking.seeker_name} • {booking.event_date}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-purple-400">£{booking.total_price?.toFixed(0)}</p>
                        <p className="text-xs text-slate-500">{booking.duration_hours}h</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Bookings */}
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
                <p className="text-sm text-slate-500 mt-1">Complete your profile to start getting booked</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((booking) => (
                  <Link key={booking.id} to={createPageUrl('BookingDetails') + `?id=${booking.id}`}>
                    <motion.div whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }} className="flex items-center gap-4 p-4 rounded-xl border border-slate-800 cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{booking.event_name || 'Event'}</h4>
                        <p className="text-sm text-slate-400">{booking.seeker_name} • {booking.event_date}</p>
                      </div>
                      <Badge className={
                        booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                        booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        booking.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-slate-500/20 text-slate-400'
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
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-400" />
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
                  <span className="text-slate-400">Total Bookings</span>
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

          {/* Quick Links */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <div className="space-y-1">
              {[
                { to: `TalentSetup?edit=true`, icon: Star, label: 'Edit Profile' },
                { to: 'Verification', icon: Shield, label: 'Verification' },
                { to: 'Bookings', icon: Calendar, label: 'All Bookings' },
                { to: 'Messages', icon: MessageSquare, label: 'Messages' },
                { to: 'Settings', icon: Settings, label: 'Settings' },
              ].map(({ to, icon: Icon, label }) => (
                <Link key={to} to={`/${to}`}>
                  <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800">
                    <Icon className="w-4 h-4 mr-3" />{label}
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