'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Calendar, MapPin, HeartPulse, Languages, Loader2, Send, Mic, MicOff, LocateFixed } from "lucide-react";
import { useState, useEffect, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { reverseGeocodeAction } from "@/app/actions";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  age: z.coerce.number().min(0, "Age must be a positive number.").max(120, "Age seems a bit high."),
  location: z.string().min(2, { message: "Please enter a city name." }),
  healthConditions: z.string().optional(),
  languagePreference: z.enum(['en', 'ta', 'hi', 'bn', 'te', 'mr'], { required_error: "Please select a language."}),
});

interface HealthFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  loading: boolean;
}

export function HealthForm({ onSubmit, loading }: HealthFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      age: '' as any,
      location: "",
      healthConditions: "",
      languagePreference: "en",
    },
  });

  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
           toast({
            variant: "destructive",
            title: "Microphone Access Denied",
            description: "Please allow microphone access in your browser settings to use voice input.",
           });
        }
        setIsListening(false);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        form.setValue('location', transcript, { shouldValidate: true });
      };

      recognitionRef.current = recognition;
    } else {
        recognitionRef.current = null;
    }
  }, [form, toast]);

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast({
        variant: "destructive",
        title: "Voice Recognition Not Supported",
        description: "Your browser does not support voice recognition. Please type your location instead.",
      });
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        variant: 'destructive',
        title: 'Geolocation Not Supported',
        description: 'Your browser does not support geolocation.',
      });
      return;
    }

    setIsFetchingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const result = await reverseGeocodeAction({ latitude, longitude });
          if (result.error) throw new Error(result.error);
          if (result.data?.city) {
            form.setValue('location', result.data.city, { shouldValidate: true });
            toast({
                title: "Location Found",
                description: `Set location to ${result.data.city}.`
            });
          } else {
            throw new Error('Could not determine city from coordinates.');
          }
        } catch (e: unknown) {
          const error = e instanceof Error ? e.message : 'An unknown error occurred.';
          toast({
            variant: 'destructive',
            title: 'Could Not Fetch City',
            description: error,
          });
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (error) => {
        let description = 'An unknown error occurred while fetching your location.';
        if(error.code === error.PERMISSION_DENIED) {
            description = 'Please allow location access in your browser settings.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
            description = 'Location information is unavailable.';
        }
        toast({
          variant: 'destructive',
          title: 'Location Access Error',
          description: description,
        });
        setIsFetchingLocation(false);
      }
    );
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-lg border-2 border-primary/10">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Your Information</CardTitle>
        <CardDescription>This information helps us personalize your health advisory.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><User size={16}/> Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Calendar size={16}/> Age</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 34" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><MapPin size={16}/> Location (City)</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input placeholder="e.g. New Delhi" {...field} />
                    </FormControl>
                    <Button type="button" size="icon" variant="outline" onClick={handleGetLocation} disabled={isFetchingLocation}>
                      {isFetchingLocation ? <Loader2 className="animate-spin" /> : <LocateFixed />}
                    </Button>
                    <Button type="button" size="icon" variant={isListening ? "destructive" : "outline"} onClick={handleVoiceInput} disabled={isFetchingLocation}>
                      {isListening ? <MicOff /> : <Mic />}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="healthConditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><HeartPulse size={16}/> Pre-existing Health Conditions (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. Asthma, Allergies"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="languagePreference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Languages size={16}/> Preferred Language</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ta">Tamil (தமிழ்)</SelectItem>
                      <SelectItem value="hi">Hindi (हिन्दी)</SelectItem>
                      <SelectItem value="bn">Bengali (বাংলা)</SelectItem>
                      <SelectItem value="te">Telugu (తెలుగు)</SelectItem>
                      <SelectItem value="mr">Marathi (मराठी)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Advisory...
                </>
              ) : (
                 <>
                  <Send className="mr-2 h-4 w-4" />
                  Get Health Advisory
                 </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
