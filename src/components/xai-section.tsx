import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function XaiSection() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
          <CardTitle className="text-2xl font-headline">Understanding Air Quality</CardTitle>
          <CardDescription>Learn more about the science behind the numbers.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-lg">What is AQI?</AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed">
              The Air Quality Index (AQI) is a scale used to report the quality of the air. It runs from 0 to 500, where higher values indicate greater levels of air pollution and greater health concern. The AQI is divided into six categories, each corresponding to a different level of health concern and having a specific color.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="text-lg">What are the common pollutants?</AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed">
              The AQI tracks five major air pollutants:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Ground-level ozone (O₃):</strong> Created by chemical reactions between oxides of nitrogen (NOx) and volatile organic compounds (VOCs) in the presence of sunlight.</li>
                <li><strong>Particle pollution (PM2.5 and PM10):</strong> A mixture of extremely small particles and liquid droplets. PM2.5 are fine inhalable particles, with diameters that are generally 2.5 micrometers and smaller.</li>
                <li><strong>Carbon monoxide (CO):</strong> A colorless, odorless gas emitted from combustion processes.</li>
                <li><strong>Sulfur dioxide (SO₂):</strong> A gas produced from burning fossil fuels (coal and oil) and from smelting mineral ores.</li>
                <li><strong>Nitrogen dioxide (NO₂):</strong> A highly reactive gas formed from emissions from cars, trucks and buses, power plants, and off-road equipment.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger className="text-lg">How is the AQI calculated?</AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed">
              Each pollutant has its own sub-index calculated based on its concentration in the air. The overall AQI is the highest of these sub-indices. For example, if the PM2.5 sub-index is 120 and the Ozone sub-index is 90, the reported AQI for that location would be 120.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger className="text-lg">How does AI forecast AQI?</AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed">
              This app uses AI and Machine Learning models to forecast AQI. These models analyze vast amounts of data, including:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Historical air quality data</li>
                <li>Weather forecasts (wind speed and direction, temperature, humidity)</li>
                <li>Topography and geographical data</li>
                <li>Data on emission sources like traffic and industrial activity</li>
              </ul>
              By identifying complex patterns in this data, the AI can predict how pollutant levels will change over the next few days, providing a valuable tool for planning activities and protecting your health.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
