import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import {
  Search, Heart, MessageSquare, Calendar, ChevronRight,
  Users, Star, Settings
} from 'lucide-react';

export default function SeekerDashboard({ user, recentBookings, maybeList }) {
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
      <div className="relative z-10">
        <p className="text-zinc-400 font-medium mb-2">Welcome back, {user?.full_name?.split(' ')[0]} 👋</p>
        <h1 className="text-3xl font-bold mb-3">Find Your Perfect Talent</h1>
        <p className="text-zinc-500 mb-6 max-w-md">Discover and book world-class performers for your next event. Swipe, save, and book with ease.</p>
        <Link to={createPageUrl('Discover')}>
          <Button className="bg-white text-black hover:bg-zinc-100 h-12 px-6 text-base font-semibold">
            <Search className="w-5 h-5 mr-2" />
            Discover Talent
          </Button>
        </Link>
      </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        {/* Quick Actions */}
        <div>
          <h2 className="font-semibold text-lg mb-4">Quick Actions</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link to={createPageUrl('Discover')}>
              <motion.div whileHover={{ scale: 1.02 }} className="p-5 rounded-2xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 cursor-pointer h-full transition-colors">
                <Search className="w-8 h-8 text-white mb-3" />
                <h3 className="font-semibold mb-1">Discover</h3>
                <p className="text-sm text-zinc-500">Swipe through talent</p>
              </motion.div>
            </Link>
            <Link to={createPageUrl('MaybeList')}>
              <motion.div whileHover={{ scale: 1.02 }} className="p-5 rounded-2xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 cursor-pointer h-full transition-colors">
                <Heart className="w-8 h-8 text-white mb-3" />
                <h3 className="font-semibold mb-1">Maybe List</h3>
                <p className="text-sm text-zinc-500">{maybeList.length} saved</p>
              </motion.div>
            </Link>
            <Link to={createPageUrl('Messages')}>
              <motion.div whileHover={{ scale: 1.02 }} className="p-5 rounded-2xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 cursor-pointer h-full transition-colors">
                <MessageSquare className="w-8 h-8 text-white mb-3" />
                <h3 className="font-semibold mb-1">Messages</h3>
                <p className="text-sm text-zinc-500">Chat with talent</p>
              </motion.div>
            </Link>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">My Bookings</h2>
            <Link to={createPageUrl('Bookings')}>
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                View all <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          {recentBookings.length === 0 ? (
            <div className="text-center py-10">
              <Calendar className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 mb-4">No bookings yet</p>
              <Link to={createPageUrl('Discover')}>
                <Button className="bg-white text-black hover:bg-zinc-100">Find Talent</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <Link key={booking.id} to={createPageUrl('BookingDetails') + `?id=${booking.id}`}>
                  <motion.div whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }} className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800 cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{booking.event_name || 'Event'}</h4>
                      <p className="text-sm text-zinc-500">{booking.talent_stage_name} • {booking.event_date}</p>
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
        {/* Saved Talent */}
        {maybeList.length > 0 && (
          <div className="bg-zinc-900 rounded-2xl border border-zinc-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Heart className="w-4 h-4 text-white" />
                Saved Talent
              </h3>
              <Link to={createPageUrl('MaybeList')}>
                <Button variant="ghost" size="sm" className="text-zinc-400 text-xs">View all</Button>
              </Link>
            </div>
            <div className="space-y-3">
              {maybeList.slice(0, 4).map((item) => (
                <Link key={item.id} to={createPageUrl('TalentProfile') + `?id=${item.talent_profile_id}`}>
                  <div className="flex items-center gap-3 hover:bg-zinc-800/50 rounded-lg p-1 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden shrink-0">
                      {item.talent_photo ? <img src={item.talent_photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Users className="w-4 h-4 text-zinc-600" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.talent_stage_name}</p>
                      <p className="text-xs text-zinc-500 capitalize">{item.talent_category?.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-700 p-6">
          <h3 className="font-semibold mb-4">Quick Links</h3>
          <div className="space-y-1">
            {[
              { to: 'Bookings', icon: Calendar, label: 'All Bookings' },
              { to: 'Messages', icon: MessageSquare, label: 'Messages', badge: unreadCount },
              { to: 'Settings', icon: Settings, label: 'Settings' },
            ].map(({ to, icon: Icon, label, badge }) => (
              <Link key={to} to={createPageUrl(to)}>
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