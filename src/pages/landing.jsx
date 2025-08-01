import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import companies from "../data/companies.json";
import faqs from "../data/faq.json";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import {  PenLine, Search } from "lucide-react";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import TextType from "@/components/ui/TextType";


const LandingPage = () => {
  const words = "Find Your Dream Job";
  return (
    <main className="flex flex-col gap-10 sm:gap-20 py-10 sm:py-20">
      <section className="text-center ">
        
          <TextGenerateEffect words={words}/>
          <h1 className="flex flex-col items-center  justify-center gradient-title font-extrabold text-4xl sm:text-6xl lg:text-8xl tracking-tighter py-4">
          <span className="flex items-center gap-2 sm:gap-6">
          <img
              src="/giphy.gif"
              className="h-12 rounded-2xl sm:h-24 lg:h-32"
              alt="JOB seek Logo"
            />
            
            and get
            <TextType 
  text={[" Hired"]}
  typingSpeed={100}
  pauseDuration={1500}
  showCursor={true}
  cursorCharacter="|"
/>
            <img
              src="/giphy.gif"
              className="h-12 rounded-2xl sm:h-24 lg:h-32"
              alt="JOB seek Logo"
            />
          </span>
        </h1>
        <p className="text-gray-300 sm:mt-4 text-xs sm:text-xl">
          Explore thousands of job listings or find the perfect candidate
        </p>
      </section>
      <div className="flex gap-6 justify-center">
        <Link to={"/jobs"}>
          <Button variant="blue" size="xl">
          <Search className="m-1 flex py-0.5" />Find Jobs
          </Button>
        </Link>
        <Link to={"/post-job"}>
          <Button variant="" size="xl">
          <PenLine className="flex m-2" color="#10b6c1" />Post a Job
          </Button>
        </Link>
      </div>
      <Carousel
        plugins={[
          Autoplay({
            delay: 2000,
          }),
        ]}
        className="w-full py-10"
      >
        <CarouselContent className="flex gap-5 sm:gap-20 items-center">
          {companies.map(({ name, id, path }) => (
            <CarouselItem key={id} className="basis-1/3 lg:basis-1/6 ">
              <img
                src={path}
                alt={name}
                className="h-10 sm:h-14  object-contain"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="flex flex-row gap-3">
        <img src="/giphy.gif" className="rounded-2xl h-14 w-38 sm:h-24 lg:h-32" />
        <img src="/giphy.gif" className="rounded-2xl h-14 w-48 sm:h-24 lg:h-32" />
        <img src="/giphy.gif" className="rounded-2xl h-14 w-48 sm:h-24 lg:h-32" />
        <img src="/giphy.gif" className="rounded-2xl h-14 w-48 sm:h-24 lg:h-32" />
        <img src="/giphy.gif" className="rounded-2xl h-14 w-48 sm:h-24 lg:h-32" />
        <img src="/giphy.gif" className="rounded-2xl h-14 w-48 sm:h-24 lg:h-32" />
        <img src="/giphy.gif" className="rounded-2xl h-14 w-38 sm:h-24 lg:h-32" />
      </div>
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:shadow-blue-400 shadow-sm hover:animate-pulse">
          <CardHeader>
            <CardTitle className="font-bold">For Job Seekers</CardTitle>
          </CardHeader>
          <CardContent>
            Search and apply for jobs, track applications, and more.
          </CardContent>
        </Card>
        <Card className="hover:shadow-blue-400 shadow-sm hover:animate-pulse">
          <CardHeader>
            <CardTitle className="font-bold">For Employers</CardTitle>
          </CardHeader>
          <CardContent>
            Post jobs, manage applications, and find the best candidates.
          </CardContent>
        </Card>
      </section>

      <Accordion type="multiple" className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index + 1}`}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </main>
  );
};

export default LandingPage;
