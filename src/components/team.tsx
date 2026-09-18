import { Eyebrow } from "./eyebrow";

const members = [
  {
    name: "Ivan",
    role: "AI entrepreneur, bootcamp host",
    photo: "/assets/ivan.jpg",
    bio: "22 years in business. For the past year and a half he has been travelling the world — without offices and without visas in the usual sense. A living example that travel and entrepreneurship go together. He runs the programme and cooks on board.",
  },
  {
    name: "Yasha",
    role: "Captain, engineer, self-made property developer",
    photo: "/assets/yasha.jpg",
    bio: "He knows the water and he knows how to build — literally and in the business sense. He is responsible for safety and logistics across the whole week. Going to sea with him isn't frightening, and talking business with him isn't boring.",
  },
];

export function Team() {
  return (
    <section id="team" className="bg-muted/40 py-20 sm:py-32">
      <div className="container-narrow">
        <Eyebrow>Team</Eyebrow>
        <h2 className="mt-4 max-w-2xl font-display text-3xl leading-tight sm:text-5xl">
          Who you&apos;ll spend this week with.
        </h2>

        <div className="mt-12 flex flex-col gap-6 md:grid md:grid-cols-2 md:gap-8">
          {members.map((member) => (
            <article
              key={member.name}
              className="group w-full overflow-hidden rounded-3xl border border-border bg-card shadow-card"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-primary">
                <img
                  src={member.photo}
                  alt={member.name}
                  width={900}
                  height={1200}
                  loading="lazy"
                  className="h-full w-full max-w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                  <h3 className="font-display text-3xl text-white">
                    {member.name}
                  </h3>
                  <p className="mt-1 text-sm text-white/80">{member.role}</p>
                </div>
              </div>
              <p className="p-6 text-[15px] leading-relaxed text-foreground/85">
                {member.bio}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
