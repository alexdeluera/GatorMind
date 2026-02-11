import "../styles/team.css";

const teamMembers = [
  {
    name: "Alex De Luera",
    title: "Project Manager",
    image: "src/headshots/Alex.png",
    linkedin: "https://www.linkedin.com/in/alexandra-de-luera/",
  },
  {
    name: "Mike Sanchez",
    title: "Scrum Master",
    image: "src/headshots/holder.avif",
    linkedin: "https://www.linkedin.com/in/michaeljesussanchez/",
  },
  {
    name: "Jesus Lopez",
    title: "Backend Developer",
    image: "src/headshots/holder.avif",
    linkedin: "https://www.linkedin.com/in/jesusdlopezmarti/",
  },
  {
    name: "Jonathan Soto",
    title: "Frontend Developer",
    image: "src/headshots/holder.avif",
    linkedin: "https://www.linkedin.com/in/sotojonathan/",
  },
  {
    name: "Yaotian Zhang",
    title: "Flex Developer",
    image: "src/headshots/holder.avif",
    linkedin: "https://www.linkedin.com/in/yaotian-zhang-32073123a/",
  },
];

export default function Team() {
  const topRow = teamMembers.slice(0, 3);
  const bottomRow = teamMembers.slice(3);

  const renderCard = (member) => (
    <a
      key={member.name}
      className="team-card"
      href={member.linkedin}
      target="_blank"
      rel="noopener noreferrer"
    >
      <img
        className="team-photo"
        src={member.image}
        alt={`${member.name} headshot`}
      />
      <div className="team-name">{member.name}</div>
      <div className="team-role">{member.title}</div>
    </a>
  );

  return (
    <section className="team-section">
      <h1 className="team-title">Meet the Team</h1>

      <div className="team-row">
        {topRow.map(renderCard)}
      </div>

      <div className="team-row centered">
        {bottomRow.map(renderCard)}
      </div>
    </section>
  );
}
