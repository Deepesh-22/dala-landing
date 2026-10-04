import { SECTIONS } from '../../data/sections.js';
import Hero from '../Hero/Hero.jsx';
import Section from './Section.jsx';

export default function Sections() {
  const [hero, ...rest] = SECTIONS;

  return (
    <>
      <Hero label={hero.label} title={hero.title} body={hero.body} />
      {rest.map((s) => (
        <Section
          key={s.id}
          id={s.id}
          label={s.label}
          title={s.title}
          body={s.body}
        />
      ))}
    </>
  );
}
