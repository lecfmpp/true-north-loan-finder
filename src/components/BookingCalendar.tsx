import React, { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar as CalendarIcon, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay, isAfter, startOfDay, addDays, isBefore } from "date-fns";
import { cn } from "@/lib/utils";

interface TimeSlot {
  id: string;
  date: string;
  time: string;
  duration_minutes: number;
  current_bookings: number;
  max_bookings: number;
}

interface BookingCalendarProps {
  onBookingConfirmed: (bookingData: any) => void;
  userInfo: {
    name: string;
    email: string;
    phone?: string;
    quizResponseId?: string;
  };
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({ onBookingConfirmed, userInfo }) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [hasAvailableDates, setHasAvailableDates] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    checkForAvailableDates();
  }, []);

  const checkForAvailableDates = async () => {
    try {
      const today = startOfDay(new Date());
      const maxDate = addDays(today, 4);
      
      // Check for any available slots in the next 4 days
      const { data, error } = await supabase
        .from('available_time_slots')
        .select('*')
        .gte('date', format(today, 'yyyy-MM-dd'))
        .lt('date', format(maxDate, 'yyyy-MM-dd'))
        .eq('is_available', true);

      if (error) throw error;
      
      // Filter slots where current_bookings < max_bookings
      const availableSlots = (data || []).filter(slot => 
        slot.current_bookings < slot.max_bookings
      );
      
      setHasAvailableDates(availableSlots.length > 0);
    } catch (error) {
      console.error('Error checking available dates:', error);
      setHasAvailableDates(false);
    }
  };

  const fetchAvailableSlots = async (date: Date) => {
    setLoading(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('available_time_slots')
        .select('*')
        .eq('date', dateStr)
        .eq('is_available', true)
        .order('time');

      if (error) throw error;
      
      // Filter slots where current_bookings < max_bookings on the client side
      const availableSlots = (data || []).filter(slot => 
        slot.current_bookings < slot.max_bookings
      );
      
      setAvailableSlots(availableSlots);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      toast({
        title: "Error",
        description: "Failed to load available time slots",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date && isAfter(date, startOfDay(new Date()))) {
      setSelectedDate(date);
      setSelectedSlot(null);
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const confirmBooking = async () => {
    if (!selectedSlot || !userInfo.name || !userInfo.email) {
      toast({
        title: "Error",
        description: "Please select a time slot and ensure your information is complete",
        variant: "destructive",
      });
      return;
    }

    setBooking(true);
    try {
      // Create the booking
      const { data: booking, error: bookingError } = await supabase
        .from('call_bookings')
        .insert({
          time_slot_id: selectedSlot.id,
          user_name: userInfo.name,
          user_email: userInfo.email,
          user_phone: userInfo.phone,
          quiz_response_id: userInfo.quizResponseId,
          booking_status: 'confirmed'
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Create Google Meet event
      const appointmentDateTime = new Date(selectedSlot.date);
      const [hours, minutes] = selectedSlot.time.split(':');
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      try {
        const { error: meetError } = await supabase.functions.invoke('create-google-meet-event', {
          body: {
            bookingId: booking.id,
            userEmail: userInfo.email,
            userName: userInfo.name,
            userPhone: userInfo.phone,
            appointmentDateTime: appointmentDateTime.toISOString(),
            durationMinutes: selectedSlot.duration_minutes
          }
        });

        if (meetError) {
          console.error('Error creating Google Meet event:', meetError);
        }
      } catch (meetError) {
        console.error('Error creating Google Meet event:', meetError);
      }

      // Email sequence functionality removed - feature no longer available

      toast({
        title: "Booking Confirmed!",
        description: `Your call is scheduled for ${format(new Date(selectedSlot.date), 'MMMM do, yyyy')} at ${format(new Date(`2000-01-01 ${selectedSlot.time}`), 'h:mm a')}`,
      });

      onBookingConfirmed({
        ...booking,
        timeSlot: selectedSlot,
        appointmentDate: format(new Date(selectedSlot.date), 'MMMM do, yyyy'),
        appointmentTime: format(new Date(`2000-01-01 ${selectedSlot.time}`), 'h:mm a')
      });

    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Booking Failed",
        description: "There was an error creating your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBooking(false);
    }
  };

  const isDateAvailable = (date: Date) => {
    const today = startOfDay(new Date());
    const maxDate = addDays(today, 4); // Only show next 4 days
    return isAfter(date, today) && isBefore(date, maxDate);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Choose Your Call Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) => !isDateAvailable(date)}
            className={cn("rounded-md border pointer-events-auto w-full")}
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
              month: "space-y-4 w-full",
              table: "w-full border-collapse space-y-1",
              head_row: "flex w-full",
              head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] text-center",
              row: "flex w-full mt-2",
              cell: "flex-1 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-12 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
              day_disabled: "text-muted-foreground opacity-50",
            }}
          />
        </CardContent>
      </Card>

      {!hasAvailableDates && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="text-orange-600 font-medium text-lg">
                ⚠️ Limited Availability
              </div>
              <p className="text-orange-800">
                Sorry, our team is helping other business owners to grow. We will release new dates soon. 
                We recommend to book a call in the next available date for you so this process can be fast 
                and you can get the offers ASAP.
              </p>
              <div className="text-sm text-orange-700 font-medium">
                📈 Book now to secure your spot and get faster funding decisions!
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Available Times for {format(selectedDate, 'MMMM do, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading available times...</div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No available times for this date. Please select another date.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableSlots.map((slot) => (
                  <Button
                    key={slot.id}
                    variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                    className="h-auto p-3 flex flex-col items-center"
                    onClick={() => handleSlotSelect(slot)}
                  >
                    <span className="font-medium">
                      {format(new Date(`2000-01-01 ${slot.time}`), 'h:mm a')}
                    </span>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {slot.duration_minutes} min
                    </Badge>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedSlot && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Confirm Your Booking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Booking Details:</h4>
              <p><strong>Date:</strong> {format(new Date(selectedSlot.date), 'MMMM do, yyyy')}</p>
              <p><strong>Time:</strong> {format(new Date(`2000-01-01 ${selectedSlot.time}`), 'h:mm a')}</p>
              <p><strong>Duration:</strong> {selectedSlot.duration_minutes} minutes</p>
              <p><strong>Name:</strong> {userInfo.name}</p>
              <p><strong>Email:</strong> {userInfo.email}</p>
            </div>
            
            <Button 
              onClick={confirmBooking} 
              disabled={booking}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
              size="lg"
            >
              {booking ? "Confirming..." : "Confirm My 15-Min Pre-Offer Call"}
            </Button>
            
            <p className="text-sm text-muted-foreground text-center">
              You'll receive a confirmation email with meeting details shortly.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BookingCalendar;