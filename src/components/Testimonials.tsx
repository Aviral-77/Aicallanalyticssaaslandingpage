import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "VP of Sales",
    company: "TechFlow Inc.",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
    content: "CallAnalytics transformed our sales process. We increased our conversion rate by 35% in just 3 months. The AI insights are incredibly accurate.",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Customer Success Manager",
    company: "GrowthLabs",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
    content: "The real-time coaching feature is a game-changer. Our new hires are performing at the level of seasoned reps within weeks instead of months.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Head of Quality",
    company: "ServicePro",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
    content: "Compliance monitoring used to take hours of manual work. Now it's automated and we catch issues in real-time. Absolutely essential for our business.",
    rating: 5,
  },
  {
    name: "David Kim",
    role: "Sales Director",
    company: "ScaleUp Solutions",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
    content: "The analytics helped us identify what our top performers were doing differently. Now we can replicate their success across the entire team.",
    rating: 5,
  },
  {
    name: "Lisa Thompson",
    role: "Operations Manager",
    company: "CustomerFirst Corp",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
    content: "Customer satisfaction scores improved dramatically once we started using the sentiment analysis. We can address issues before they escalate.",
    rating: 5,
  },
  {
    name: "James Wilson",
    role: "Training Manager",
    company: "CallCenter Elite",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
    content: "Training new agents is 60% faster with the automated coaching insights. The platform practically trains itself on successful conversation patterns.",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 lg:py-32">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl">
            Trusted by Industry Leaders
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how companies are using our AI call analytics to drive growth and improve customer experiences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-border/50">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  
                  <p className="text-muted-foreground">"{testimonial.content}"</p>
                  
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                      <AvatarFallback>{testimonial.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role}, {testimonial.company}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}