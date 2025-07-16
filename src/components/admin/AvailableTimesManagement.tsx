import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar as CalendarIcon, Clock, Users, Trash2, Edit, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface TimeSlot {
  id: string;
  date: string;
  time: string;
  duration_minutes: number;
  is_available: boolean;
  max_bookings: number;
  current_bookings: number;
  created_at: string;
}

interface Booking {
  id: string;
  user_name: string;
  user_email: string;
  user_phone?: string;
  booking_status: string;
  created_at: string;
  time_slot: TimeSlot;
}

const AvailableTimesManagement = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRulesDialog, setShowRulesDialog] = useState(false);
  const [newSlot, setNewSlot] = useState({
    date: '',
    time: '',
    duration_minutes: 15,
    max_bookings: 1
  });
  const [bookingRules, setBookingRules] = useState({
    defaultDuration: 15,
    daysInAdvance: 4,
    timeAvailable: '9:00 AM - 5:00 PM',
    maxBookingsPerSlot: 1
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTimeSlots();
    fetchBookings();
  }, []);

  const fetchTimeSlots = async () => {
    try {
      // Get current week's time slots
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      const { data, error } = await supabase
        .from('available_time_slots')
        .select('*')
        .gte('date', startOfWeek.toISOString().split('T')[0])
        .lte('date', endOfWeek.toISOString().split('T')[0])
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;
      setTimeSlots(data || []);
    } catch (error) {
      console.error('Error fetching time slots:', error);
      toast({
        title: "Error",
        description: "Failed to load time slots",
        variant: "destructive",
      });
    }
  };

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('call_bookings')
        .select(`
          *,
          time_slot:available_time_slots(*)
        `)
        .order('created_at', { ascending: false })
        .limit(10); // Show only recent 10 bookings

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBookingRules = () => {
    // Here you could save rules to database if needed
    toast({
      title: "Success",
      description: "Booking rules updated successfully",
    });
    setShowRulesDialog(false);
  };

  const addTimeSlot = async () => {
    if (!newSlot.date || !newSlot.time) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('available_time_slots')
        .insert({
          date: newSlot.date,
          time: newSlot.time,
          duration_minutes: newSlot.duration_minutes,
          max_bookings: newSlot.max_bookings,
          is_available: true,
          current_bookings: 0
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Time slot added successfully",
      });

      setNewSlot({
        date: '',
        time: '',
        duration_minutes: 15,
        max_bookings: 1
      });
      setShowAddDialog(false);
      fetchTimeSlots();
    } catch (error: any) {
      console.error('Error adding time slot:', error);
      toast({
        title: "Error",
        description: error.message.includes('duplicate') ? "Time slot already exists" : "Failed to add time slot",
        variant: "destructive",
      });
    }
  };

  const toggleSlotAvailability = async (slotId: string, isAvailable: boolean) => {
    try {
      const { error } = await supabase
        .from('available_time_slots')
        .update({ is_available: !isAvailable })
        .eq('id', slotId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Time slot ${!isAvailable ? 'enabled' : 'disabled'}`,
      });

      fetchTimeSlots();
    } catch (error) {
      console.error('Error updating time slot:', error);
      toast({
        title: "Error",
        description: "Failed to update time slot",
        variant: "destructive",
      });
    }
  };

  const deleteTimeSlot = async (slotId: string) => {
    if (!confirm('Are you sure you want to delete this time slot? This will also delete any associated bookings.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('available_time_slots')
        .delete()
        .eq('id', slotId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Time slot deleted successfully",
      });

      fetchTimeSlots();
      fetchBookings();
    } catch (error) {
      console.error('Error deleting time slot:', error);
      toast({
        title: "Error",
        description: "Failed to delete time slot",
        variant: "destructive",
      });
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('call_bookings')
        .update({ booking_status: status })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Booking status updated",
      });

      fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'no_show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Loading available times...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-xl font-bold">Bookings & Time Management</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage call bookings and time slot availability
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Dialog open={showRulesDialog} onOpenChange={setShowRulesDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs">
                <Settings className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Rules & Settings</span>
                <span className="sm:hidden">Rules</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Booking Rules & Settings</DialogTitle>
                <DialogDescription>
                  Configure the default booking parameters
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="defaultDuration">Default Meeting Duration (minutes)</Label>
                  <Select 
                    value={bookingRules.defaultDuration.toString()} 
                    onValueChange={(value) => setBookingRules({ ...bookingRules, defaultDuration: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="daysInAdvance">Booking Window (days in advance)</Label>
                  <Input
                    id="daysInAdvance"
                    type="number"
                    min="1"
                    max="30"
                    value={bookingRules.daysInAdvance}
                    onChange={(e) => setBookingRules({ ...bookingRules, daysInAdvance: parseInt(e.target.value) || 4 })}
                  />
                </div>
                <div>
                  <Label htmlFor="timeAvailable">Available Hours</Label>
                  <Input
                    id="timeAvailable"
                    value={bookingRules.timeAvailable}
                    onChange={(e) => setBookingRules({ ...bookingRules, timeAvailable: e.target.value })}
                    placeholder="e.g., 9:00 AM - 5:00 PM"
                  />
                </div>
                <div>
                  <Label htmlFor="maxBookingsPerSlot">Max Bookings per Time Slot</Label>
                  <Input
                    id="maxBookingsPerSlot"
                    type="number"
                    min="1"
                    value={bookingRules.maxBookingsPerSlot}
                    onChange={(e) => setBookingRules({ ...bookingRules, maxBookingsPerSlot: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <Button onClick={updateBookingRules} className="w-full">
                  Update Rules
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="text-xs">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Time Slot</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Time Slot</DialogTitle>
                <DialogDescription>
                  Create a new available time slot for calls
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newSlot.date}
                    onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newSlot.time}
                    onChange={(e) => setNewSlot({ ...newSlot, time: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Select 
                    value={newSlot.duration_minutes.toString()} 
                    onValueChange={(value) => setNewSlot({ ...newSlot, duration_minutes: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="maxBookings">Max Bookings</Label>
                  <Input
                    id="maxBookings"
                    type="number"
                    min="1"
                    value={newSlot.max_bookings}
                    onChange={(e) => setNewSlot({ ...newSlot, max_bookings: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <Button onClick={addTimeSlot} className="w-full">
                  Add Time Slot
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Current Rules Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            Current Booking Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
              <Clock className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Meeting Duration</p>
                <p className="text-sm font-bold">{bookingRules.defaultDuration} minutes</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
              <CalendarIcon className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Booking Window</p>
                <p className="text-sm font-bold">{bookingRules.daysInAdvance} days ahead</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
              <Clock className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Available Hours</p>
                <p className="text-sm font-bold">{bookingRules.timeAvailable}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
              <Users className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Max per Slot</p>
                <p className="text-sm font-bold">{bookingRules.maxBookingsPerSlot} booking(s)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Bookings Section - Moved to Top */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recent Bookings ({bookings.length})
          </CardTitle>
          <CardDescription>
            Latest 10 call bookings and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No bookings yet. When users book calls, they'll appear here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Email</TableHead>
                    <TableHead className="text-xs">Date & Time</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                 {bookings.map((booking) => (
                   <TableRow key={booking.id}>
                     <TableCell className="font-medium text-xs sm:text-sm">{booking.user_name}</TableCell>
                     <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{booking.user_email}</TableCell>
                    <TableCell>
                      {booking.time_slot && (
                        <div>
                          <div className="font-medium">{format(parseISO(booking.time_slot.date), 'MMM dd, yyyy')}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(`2000-01-01 ${booking.time_slot.time}`), 'h:mm a')}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(booking.booking_status)}>
                        {booking.booking_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={booking.booking_status}
                        onValueChange={(value) => updateBookingStatus(booking.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="no_show">No Show</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                 ))}
               </TableBody>
             </Table>
           </div>
           )}
        </CardContent>
      </Card>

      {/* Current Week Time Slots Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            This Week's Time Slots ({timeSlots.length})
          </CardTitle>
          <CardDescription>
            Available time slots for the current week
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timeSlots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No time slots available for this week. Add some using the "Add Time Slot" button above.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeSlots.map((slot) => (
                  <TableRow key={slot.id}>
                    <TableCell className="font-medium">
                      {format(parseISO(slot.date), 'EEE, MMM dd')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(`2000-01-01 ${slot.time}`), 'h:mm a')}
                    </TableCell>
                    <TableCell>{slot.duration_minutes} min</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {slot.current_bookings}/{slot.max_bookings}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={slot.is_available ? "default" : "secondary"}>
                        {slot.is_available ? "Available" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleSlotAvailability(slot.id, slot.is_available)}
                        >
                          {slot.is_available ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteTimeSlot(slot.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AvailableTimesManagement;