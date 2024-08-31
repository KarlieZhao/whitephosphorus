import Container from "@/app/_components/container";
import { Map } from "@/app/_components/mapembed";
import { getAllPosts } from "@/lib/api";
import { Cyberspace } from "./_components/cyberspace";

export default function Index() {
  const allPosts = getAllPosts();

  const heroPost = allPosts[0];

  const morePosts = allPosts.slice(1);

  return (
    <main>
      <Map />
      <Container>
        <Cyberspace />
        {/* <HeroPost
          title={heroPost.title}
          coverImage={heroPost.coverImage}
          date={heroPost.date}
          author={heroPost.author}
          slug={heroPost.slug}
          excerpt={heroPost.excerpt}
        /> }
        { {morePosts.length > 0 && <MoreStories posts={morePosts} />} */}
      </Container>
    </main>
  );
}
