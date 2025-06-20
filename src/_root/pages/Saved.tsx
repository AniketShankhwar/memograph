import { useQuery } from "@tanstack/react-query";
import { GridPostList, Loader } from "@/components/shared";
import { getUserSavedPosts } from "@/lib/appwrite/api";
import { useGetCurrentUser } from "@/lib/react-query/queries";

const Saved = () => {
  const { data: currentUser } = useGetCurrentUser();
  const { data: savedData, isLoading } = useQuery({
    queryKey: ['savedPosts', currentUser?.$id],
    queryFn: () => getUserSavedPosts(currentUser?.$id || ''),
    enabled: !!currentUser?.$id,
  });

  if (isLoading) {
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );
  }

  // Extract and transform saved posts
  const savePosts = savedData?.documents
    .filter(doc => doc.post && doc.post.creator)
    .map(doc => ({
      ...doc.post,
      creator: doc.post.creator
    })) || [];

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

      {savePosts.length === 0 ? (
        <p className="text-light-4 mt-10 text-center w-full">
          {currentUser?.save?.length > 0
            ? "Couldn't load any saved posts"
            : "You haven't saved any posts yet"}
        </p>
      ) : (
        <ul className="w-full flex justify-center max-w-5xl gap-9">
          <GridPostList 
            posts={savePosts} 
            showStats={false} 
            showUser={true}
          />
        </ul>
      )}
    </div>
  );
};

export default Saved;