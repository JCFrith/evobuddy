import { NextResponse } from "next/server";
import { z } from "zod";
import { getSpecies } from "@/species/registry";
import { resolveTraits } from "@/lib/traits";
import { getAuthenticatedUserId } from "@/lib/avatarService";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  speciesSlug: z.string(),
  name: z.string().min(1).max(20),
  seed: z.string().min(1).max(64),
  bodyColor: z.string(),
  secondaryColor: z.string(),
  faceColor: z.string(),
});

const NAME_PATTERN = /^[A-Za-z0-9 '-]{1,20}$/;

/**
 * Hatch a brand-new avatar for the signed-in user. Every randomized trait
 * is re-derived server-side from (species, seed) rather than trusted from
 * the request body -- the client's onboarding preview and the server's
 * stored result are guaranteed to match because they run the exact same
 * deterministic function, but only the server's computation is ever
 * persisted.
 */
export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { speciesSlug, name, seed, bodyColor, secondaryColor, faceColor } = parsed.data;

  if (!NAME_PATTERN.test(name)) {
    return NextResponse.json({ error: "Invalid name." }, { status: 400 });
  }

  const species = getSpecies(speciesSlug);
  if (!species) {
    return NextResponse.json({ error: "Unknown species." }, { status: 400 });
  }
  if (
    !species.allowedBodyColors.includes(bodyColor) ||
    !species.allowedSecondaryColors.includes(secondaryColor) ||
    !species.allowedFaceColors.includes(faceColor)
  ) {
    return NextResponse.json({ error: "Color not allowed for this species." }, { status: 400 });
  }

  const traits = resolveTraits(species, seed);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("avatars")
    .insert({
      user_id: userId,
      species_slug: species.slug,
      name,
      seed,
      body_color: bodyColor,
      secondary_color: secondaryColor,
      face_color: faceColor,
      eye_variant: traits.eyeVariant,
      mouth_variant: traits.mouthVariant,
      ear_variant: traits.earVariant,
      pattern_variant: traits.patternVariant,
      personality: traits.personality,
    })
    .select("id")
    .single();

  if (error) {
    const alreadyExists = error.code === "23505";
    return NextResponse.json(
      { error: alreadyExists ? "You've already hatched an avatar." : "Could not hatch avatar." },
      { status: alreadyExists ? 409 : 500 }
    );
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
