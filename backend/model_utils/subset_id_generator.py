import numpy as np

def generate_subset_ids(
    total_examples=162770,   # Full CelebA size
    subset_size=5000,        # How many examples you want
    output_path="subset_ids.npy"
):
    """
    Generates a random subset of CelebA example IDs and saves them to a .npy file.

    Args:
        total_examples: Total number of examples in CelebA (162,770)
        subset_size: Number of examples to sample (e.g., 5,000)
        output_path: Where to save the .npy file
    """

    # Randomly sample unique example IDs
    subset_ids = np.random.choice(
        total_examples,
        size=subset_size,
        replace=False
    )

    # Save to disk
    np.save(output_path, subset_ids)

    print(f"Saved {subset_size} subset IDs to {output_path}")


if __name__ == "__main__":
    generate_subset_ids()