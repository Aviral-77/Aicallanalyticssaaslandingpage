import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { Button } from "./ui/button";

const faqs = [
  {
    question: "What types of content can I paste in?",
    answer:
      "Repost AI works with YouTube videos (including podcasts on YouTube), blog posts, Medium articles, Substack newsletters, Dev.to posts, Spotify podcast episodes (via episode pages), and any publicly accessible article URL. If it has readable text or a transcript, we can work with it.",
  },
  {
    question: "How does the LinkedIn persona matching work?",
    answer:
      "When you connect your LinkedIn account, Repost AI analyzes up to 50 of your recent public posts to understand your writing style — vocabulary, sentence structure, preferred hooks, common themes, and post length. Future generated content uses this profile so the output sounds like you wrote it, not like generic AI copy.",
  },
  {
    question: "How good is the AI output really? Will it need heavy editing?",
    answer:
      "Most users copy the output with minor tweaks or none at all. The AI is tuned specifically for LinkedIn and Twitter formats, not generic content. You can also regenerate or choose from 3 different angle variants if the first output doesn't hit the mark. The more you use the persona matching feature, the better it gets.",
  },
  {
    question: "What platforms does Repost AI generate content for?",
    answer:
      "Currently: LinkedIn posts, Twitter/X threads, newsletter blurbs (email format), and standalone short-form hooks. Instagram and Threads support are on the roadmap. You choose which formats you want on each generation.",
  },
  {
    question: "Can I edit the generated posts before copying?",
    answer:
      "Absolutely. All generated text is fully editable inline — just click to edit. You can tweak wording, adjust the hook, add personal anecdotes, or change the CTA before copying. We're also building a built-in scheduler so you can edit and schedule in one place.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "Yes. The free plan includes 10 posts per month with LinkedIn and Twitter output, and 3 tone presets. No credit card required to sign up. When you're ready to go unlimited and unlock persona matching, threads, and analytics, you can upgrade to Pro.",
  },
  {
    question: "How is this different from ChatGPT or other AI writers?",
    answer:
      "General AI tools require you to copy-paste content, write a detailed prompt, and do multiple rounds of iteration. Repost AI is purpose-built for social repurposing: just a link, one click, and you get platform-optimized output. We also have LinkedIn-specific formatting, thread generators, and persona analysis that generic tools don't offer.",
  },
  {
    question: "Is my content and LinkedIn data kept private?",
    answer:
      "Yes. We don't store your LinkedIn content beyond what's needed for persona analysis, and we never post on your behalf without explicit action. Your generated posts are yours. We're GDPR-compliant and you can delete your account and all associated data at any time.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 lg:py-32">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about Repost AI.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-border/60 rounded-xl px-6 hover:border-primary/30 transition-colors"
            >
              <AccordionTrigger className="text-left hover:no-underline font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="text-center mt-12 space-y-3">
          <p className="text-muted-foreground">Still have questions?</p>
          <Button variant="outline">Chat with Us</Button>
        </div>
      </div>
    </section>
  );
}
