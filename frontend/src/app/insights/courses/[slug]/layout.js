import { generatePageMeta, SITE } from "@/lib/seo";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://backend:8000/api";

async function getCourse(slug) {
  try {
    const res = await fetch(`${API_BASE}/insights/courses/${slug}/`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const course = await getCourse(params.slug);

  if (!course) {
    return generatePageMeta({
      title: "Course Not Found",
      description: "This course could not be found.",
      path: "/insights/courses",
      noIndex: true,
    });
  }

  return generatePageMeta({
    title:       course.title,
    description: course.description ||
      `Enrol in "${course.title}" — a ${course.level || ""} course by Finlogic Capital on ${course.pillar || "investment strategy"}.`,
    path:  `/insights/courses/${course.slug}`,
    image: course.featured_image || `${SITE.url}/og-image.png`,
    keywords: [
      course.level,
      course.pillar,
      "investment course Nepal",
      "PE education",
      "Finlogic Campus",
    ].filter(Boolean),
  });
}

export { default } from "./page";
