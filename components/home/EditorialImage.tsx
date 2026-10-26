import Image from "next/image";

export function EditorialImage() {
  return <section className="home-container py-16 md:py-24" aria-label="Anvaya editorial image">
    <figure className="editorial-image relative overflow-hidden rounded-[1.5rem] bg-[#d8ded5] md:rounded-[2rem]"><Image src="/assets/sansad-bhavan.jpg" alt="The old Parliament building in New Delhi" fill sizes="(max-width: 768px) 100vw, 1280px" className="object-cover object-center" priority /><div className="absolute inset-0 bg-gradient-to-t from-[#102e3c]/45 via-transparent to-transparent" /><figcaption className="sans absolute bottom-5 left-5 right-5 flex flex-col gap-1 text-xs text-white md:bottom-7 md:left-7"><span>New Delhi · Parliament in session</span><span className="text-white/75">Image: Nikhil B. / Wikimedia Commons · CC BY-SA 4.0</span></figcaption></figure>
  </section>;
}
