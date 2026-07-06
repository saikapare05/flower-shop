import { useLanguage } from '@/lib/i18n';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

const categoriesList = [
  'flower', 'marriage', 'wedding', 'mandap', 'haldi', 'mehendi', 'engagement', 'reception', 
  'birthday', 'baby_shower', 'anniversary', 'naming', 'housewarming', 'corporate', 'stage', 
  'car', 'temple', 'home', 'room', 'welcome', 'bouquet', 'balloon', 'torans', 'funeral'
];

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  email: z.string().email("Valid email required").optional().or(z.literal('')),
  eventType: z.string().min(1, "Please select an event type"),
  date: z.string().min(1, "Please select a date"),
  location: z.string().min(2, "Location is required"),
  budget: z.string().min(1, "Please select a budget"),
  message: z.string().optional(),
});

export function Enquiry() {
  const { t } = useLanguage();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      eventType: "",
      date: "",
      location: "",
      budget: "",
      message: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const eventName = t(`services.items.${values.eventType}.name`);
    
    const text = `Hello SAI FLOWERS AND DECORATORS! 🌸\n\n*Name:* ${values.name}\n*Phone:* ${values.phone}\n*Email:* ${values.email || 'N/A'}\n*Event Type:* ${eventName}\n*Event Date:* ${values.date}\n*Location:* ${values.location}\n*Budget:* ${values.budget}\n*Message:* ${values.message || 'None'}\n\nI would like to enquire about your decoration services.`;
    
    const encodedText = encodeURIComponent(text);
    const url = `https://wa.me/919960629513?text=${encodedText}`;
    
    window.open(url, '_blank');
    toast.success("Redirecting to WhatsApp...");
    form.reset();
  }

  return (
    <section id="enquiry" className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-border">
          <div className="bg-[#1E5631] p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-2">{t('enquiry.heading')}</h2>
            <p className="text-white/80">Fill details and we will connect via WhatsApp</p>
          </div>
          
          <div className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('enquiry.name')}</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('enquiry.phone')}</FormLabel>
                        <FormControl>
                          <Input placeholder="+91 9876543210" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('enquiry.email')} (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="john@example.com" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="eventType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('enquiry.eventType')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder={t('enquiry.selectEvent')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categoriesList.map(cat => (
                              <SelectItem key={cat} value={cat}>
                                {t(`services.items.${cat}.name`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('enquiry.date')}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('enquiry.location')}</FormLabel>
                        <FormControl>
                          <Input placeholder="Pune, MH" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('enquiry.budget')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder={t('enquiry.selectBudget')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Under ₹10,000">Under ₹10,000</SelectItem>
                            <SelectItem value="₹10,000 - ₹25,000">₹10,000 - ₹25,000</SelectItem>
                            <SelectItem value="₹25,000 - ₹50,000">₹25,000 - ₹50,000</SelectItem>
                            <SelectItem value="₹50,000 - ₹1,00,000">₹50,000 - ₹1,00,000</SelectItem>
                            <SelectItem value="Above ₹1,00,000">Above ₹1,00,000</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('enquiry.message')} (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us about your theme, colors, or specific requirements..." 
                          className="resize-none bg-background h-24"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" size="lg" className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-lg h-14 rounded-xl">
                  <MessageCircle className="w-6 h-6 mr-2" />
                  {t('enquiry.submit')}
                </Button>
              </form>
            </Form>
          </div>
        </div>

      </div>
    </section>
  );
}
