import Container from "@/app/_components/container";
import { Map } from "@/app/_components/mapembed";
import { getAllPosts } from "@/lib/api";
import { Cyberspace } from "./_components/cyberspace";
import { AttacksPerArea } from "./_components/attacks-per-area";
import { AttacksPerMonth } from "./_components/attacks-per-month";
import { AttacksPerDay } from "./_components/attacksperday";
import { Footer } from "./_components/footer";

export default function Index() {
  return (
    <main>
      <Map />
      <Container>
        <AttacksPerArea />
        <AttacksPerMonth />
        <AttacksPerDay />
        <Cyberspace />
        <Footer />
      </Container>
    </main>
  );
}
