import { Background, Footer, Marquee, Nav } from "./sections/Chrome";
import { Flexibility } from "./sections/Flexibility";
import { GetStarted } from "./sections/GetStarted";
import { Hero } from "./sections/Hero";
import { HowItWorks } from "./sections/HowItWorks";
import { Policy } from "./sections/Policy";
import { Problem } from "./sections/Problem";
import { Security } from "./sections/Security";

export function App() {
  return (
    <>
      <Background />
      <Nav />
      <main id="top">
        <Hero />
        <Marquee />
        <Problem />
        <HowItWorks />
        <Policy />
        <Flexibility />
        <Security />
        <GetStarted />
        <Footer />
      </main>
    </>
  );
}
