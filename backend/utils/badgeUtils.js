// utils/badgeUtils.js
const mongoose = require('mongoose');
const Artist = require('../models/Artist');
const Artwork = require('../models/Artwork');
const Course = require('../models/Course');
const BlogPost = require('../models/BlogPost');

// Helper to calculate the tier based on count
const calculateTier = (count) => {
  if (count >= 9) return 3; // Gold
  if (count >= 6) return 2; // Silver
  if (count >= 3) return 1; // Bronze
  return 0; // No badge
};

const updateArtistBadges = async (artistId) => {
  if (!artistId) return;

  try {
    // Use Promise.all to count all content types in parallel for efficiency
    const [artworkCount, courseCount, blogCount] = await Promise.all([
      Artwork.countDocuments({ artist: artistId }),
      Course.countDocuments({ artist: artistId }),
      BlogPost.countDocuments({ artist: artistId }),
    ]);

    // Calculate the new tier for each track
    const newArtworkTier = calculateTier(artworkCount);
    const newCourseTier = calculateTier(courseCount);
    const newBlogTier = calculateTier(blogCount);
    
    // Update the artist's document in the database
    await Artist.findByIdAndUpdate(artistId, {
      artworkBadgeTier: newArtworkTier,
      courseBadgeTier: newCourseTier,
      blogBadgeTier: newBlogTier,
    });

    console.log(`Badges updated for artist ${artistId}: Artworks=${newArtworkTier}, Courses=${newCourseTier}, Blogs=${newBlogTier}`);

  } catch (error) {
    console.error(`Failed to update badges for artist ${artistId}:`, error);
  }
};

module.exports = { updateArtistBadges };