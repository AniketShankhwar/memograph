import { storage, appwriteConfig } from "@/lib/appwrite/config";
import { GridPostList, Loader } from "@/components/shared";
import { useGetCurrentUser } from "@/lib/react-query/queries";
import { useEffect, useState } from "react";

const Saved = () => {
  const { data: currentUser } = useGetCurrentUser();
  const [savePosts, setSavePosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const processSavedPosts = async () => {
      if (!currentUser?.save) {
        setLoading(false);
        return;
      }

      const validPosts = [];
      const invalidPosts = [];

      for (const saveRecord of currentUser.save) {
        try {
          // Skip if post is completely missing
          if (!saveRecord.post) {
            invalidPosts.push({...saveRecord, reason: "Post missing"});
            continue;
          }

          const post = saveRecord.post;
          
          // Check for creator existence and required fields
          if (!post.creator || !post.creator.$id) {
            invalidPosts.push({...saveRecord, reason: "Creator missing"});
            continue;
          }

          // Try to get creator details directly
          let creatorDetails = post.creator;
          
          // If creator is incomplete, try to fetch it
          if (!creatorDetails.name || !creatorDetails.username) {
            try {
              // In a real app, you'd fetch creator details here
              console.warn("Incomplete creator data, needs fetch:", creatorDetails.$id);
            } catch (fetchError) {
              console.error("Failed to fetch creator:", fetchError);
              invalidPosts.push({...saveRecord, reason: "Creator fetch failed"});
              continue;
            }
          }

          // Use fallback values for missing creator info
          creatorDetails = {
            $id: creatorDetails.$id,
            name: creatorDetails.name || 'User',
            username: creatorDetails.username || 'user',
            imageUrl: creatorDetails.imageId
              ? storage.getFileView(appwriteConfig.storageId, creatorDetails.imageId)
              : creatorDetails.imageUrl || "/assets/icons/profile-placeholder.svg",
          };

          validPosts.push({
            ...post,
            creator: creatorDetails,
            imageUrl: post.imageId
              ? storage.getFileView(appwriteConfig.storageId, post.imageId)
              : post.imageUrl || "/assets/icons/profile-placeholder.svg",
            likes: post.likes || [],
          });
        } catch (error) {
          console.error("Error processing saved post:", error);
          invalidPosts.push({...saveRecord, reason: "Processing error"});
        }
      }

      if (invalidPosts.length > 0) {
        console.group("Failed to load saved posts");
        console.table(invalidPosts, ["$id", "reason"]);
        console.groupEnd();
        
        setError(`${invalidPosts.length} posts have data issues`);
      }

      setSavePosts(validPosts.reverse());
      setLoading(false);
    };

    if (currentUser) {
      processSavedPosts();
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );
  }

  return (
    <div className="saved-container">
      <div className="flex gap-2 w-full max-w-5xl">
        <img
          src="/assets/icons/save.svg"
          width={36}
          height={36}
          alt="saved"
          className="invert-white"
        />
        <h2 className="h3-bold md:h2-bold text-left w-full">Saved Posts</h2>
      </div>

      {!currentUser ? (
        <Loader />
      ) : (
        <>
          {savePosts.length === 0 ? (
            <div className="text-center mt-10">
              <p className="text-light-4">
                {currentUser.save?.length > 0
                  ? "Couldn't load any saved posts"
                  : "You haven't saved any posts yet"}
              </p>
              {error && (
                <p className="text-light-3 mt-2">
                  {error} - check console for details
                </p>
              )}
            </div>
          ) : (
            <>
              <ul className="w-full flex justify-center max-w-5xl gap-9">
                <GridPostList 
                  posts={savePosts} 
                  showStats={false} 
                  showUser={true}
                />
              </ul>
              {error && (
                <p className="text-light-3 mt-4 text-center">
                  {error} - some posts not shown
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Saved;